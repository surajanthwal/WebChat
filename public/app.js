angular.module('MyApp', ['btford.socket-io', 'MyApp.config', 'cgNotify', 'ui.router', 'ngFileUpload', 'ngDialog', 'angularjs-dropdown-multiselect'])
  .controller('SignUpCtrl', ['$scope', '$state', function ($scope, $state) {
    var vm = this;
    vm.user = {};
    vm.submitForm = function () {
      console.log("Inside submit function");
      $state.go('ChatScreen', {'user': vm.user});
    };

  }])
  .controller('DialogueController', ['$scope', 'Socket', '$filter', 'listOfFriends', 'user', function ($scope, Socket, $filter, listOfFriends, user) {
    var vm = this;
    // console.log("inside dialogue controller:");
    // console.log(listOfFriends);
    // console.log(user);

    $scope.friend = [];
    $scope.friends = [];
    var obj = {}, id = 1;
    angular.forEach(listOfFriends, function (value, key) {
      obj.id = id++;
      obj.label = value.firstName;
      $scope.friends.push(obj);
      obj = {};
    });


    $scope.settings = {
      smartButtonMaxItems: 10
    };

    $scope.submitForm = function () {
      angular.forEach($scope.friends, function (value, key) {
        angular.forEach($scope.friend, function (value1, key) {
          if (value1.id == value.id)
            value1.label = value.label;
        });


      });
      var group = {
        groupName: $scope.grpName,
        groupStatus: $scope.grpStatus,
        groupParticipants: $scope.friend
      };
      if ($scope.friends != []) {
        // Socket.emit('new Group', {
        //   FromUserName: user.firstName,
        //   groupData: group
        // });
        $scope.$emit('newGroup', {
          FromUserName: user.firstName,
          groupData: group
        });
      }
      $scope.closeThisDialog();
    }


  }])
  .controller('ChatCtrl', ['$scope', 'Socket', '$filter', '$stateParams', 'notify', '$timeout', 'Upload', 'ngDialog', function ($scope, Socket, $filter, $stateParams, notify, $timeout, Upload, ngDialog) {
    var vm = this;

    //The current user
    vm.user = $stateParams.user;

    //An array to hold all the messages in the chat box
    vm.Messages = [];

    //User's friends who are online and are shown active in the left bar
    vm.Friends = [];

    //Group Chat
    vm.Groups = [];

    //The actuall chat box for sending private one to one messages
    vm.chatBox = false;

    //The user on the other side.
    vm.chatUser = {};

    //for storing chat history
    vm.chatLogs = {};

    //for storing group chats history
    vm.groupChatLogs = {};

    //promise for 'is typing'
    var inputChangedPromise;


    vm.messageDeliver = function () {
      if (vm.userMessage != null) {
        vm.userMessage = vm.userMessage.trim();
        if (vm.userMessage == "") {
          vm.userMessage = null;
          return;
        }

        var chatObject = {
          time: $filter('date')(new Date(), 'hh:mm a, EEE'),
          firstName: vm.user.firstName,
          messageBody: vm.userMessage
        };
        if (vm.chatUser.hasLeft)
          chatObject.hasLeft = true;

        var messageObject = {
          FromUserName: vm.user.firstName,
          ToUserName: vm.chatUser.firstName,
          message: vm.userMessage
        };

        var x = vm.chatUser.firstName;
        if (!vm.chatUser.isGroup) {
          vm.chatLogs[x].push(chatObject);
          vm.Messages = vm.chatLogs[x];
          Socket.emit('new message', messageObject);
        } else {
          // vm.groupChatLogs[x].push(chatObject);
          // vm.Messages = vm.groupChatLogs[x];
          messageObject.isGroup = true;
          Socket.emit('new message', messageObject);
        }
        $scope.$watch('vm.Messages', function (newVal, oldVal) {
          $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
        });

        //4th event


        vm.userMessage = null;
      }
    };

    vm.sendMessage = function (event) {
      if (event.which === 13) {
        vm.messageDeliver();
      } else {
        if (!vm.chatUser.isGroup) {
          if (inputChangedPromise) {
            $timeout.cancel(inputChangedPromise);
            Socket.emit('is typing', {
              FromUserName: vm.user.firstName,
              ToUserName: vm.chatUser.firstName,
              isTyping: true
            });
          }
          inputChangedPromise = $timeout(function () {
            Socket.emit('is typing', {
              FromUserName: vm.user.firstName,
              ToUserName: vm.chatUser.firstName,
              isTyping: false
            });
          }, 2000);
        }
      }
    };

    vm.ChatMessageCreation = function (friend) {
      vm.chatUser = angular.copy(friend);
      friend.color = 'white';
      var x = friend.firstName;
      if (!vm.chatUser.isGroup)
        vm.Messages = vm.chatLogs[x];
      else
        vm.Messages = vm.groupChatLogs[x];
      $scope.$watch('vm.Messages', function (newVal, oldVal) {
        $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
      });

    };

    vm.createGroupChatDialogue = function () {
      console.log("clicked group glyphicon");
      $scope.value = true;
      ngDialog.open({
        template: 'GroupChat/groupChats.html',
        className: 'ngdialog-theme-default',
        resolve: {
          listOfFriends: function FRIEND() {
            return vm.Friends;
          },
          user: function USER() {
            return vm.user;
          }
        },
        controller: 'DialogueController',
        scope: $scope
        // controllerAs: 'dc',

      });
    };

    $scope.$on('newGroup', function (event, data) {
      console.log("Inside Chat Ctrl");
      var group = {
        firstName: data.groupData.groupName,
        status: data.groupData.groupStatus,
        groupMembers: data.groupData.groupParticipants,
        createdBy: vm.user.firstName
      };
      // vm.Groups.push(group);
      // console.log(data);
      Socket.emit('new group', group);
    });
    Socket.on('new group', function (data) {
      vm.groupChatLogs[data.firstName] = [];
      var groupObject = {};
      groupObject = data;
      var tooltip = "Participants: ";
      angular.forEach(data.groupMembers, function (value, key) {
        tooltip += value.label + ", ";
      });
      tooltip += data.createdBy + "\n";
      tooltip += "Created by: " + data.createdBy;
      groupObject.tooltip = tooltip;
      groupObject.color = "white";
      groupObject.isGroup = true;
      vm.Groups.push(groupObject);
    });

    //1st event
    Socket.emit('add user', {user: vm.user});

    //2nd event
    Socket.on('earlier users', function (data) {
      var x = data.username;
      vm.chatLogs[x] = [];
      // console.log(vm.chatLogs);
      vm.Friends.push({
        firstName: data.username,
        status: data.status,
        color: 'white',
        message: '',
        isTyping: false
      });
    });

    //3rd event
    Socket.on('user joined', function (data) {

      var x = data.username;
      vm.chatLogs[x] = [];
      // console.log(vm.chatLogs);
      vm.totalUsers = data.numUsers;
      vm.Friends.push({
        firstName: data.username,
        status: data.status,
        color: 'white',
        message: '',
        isTyping: false
      });
      notifyMesage = x + " has come online!!!";
      notify({message: notifyMesage, duration: '3000', position: 'center'});
    });

    //5th event
    Socket.on('new message', function (data) {
      console.log(data);
      var x = data.FromUserName;
      var chatObject = {
        time: $filter('date')(new Date(), 'hh:mm a, EEE'),
        firstName: data.FromUserName,
      };
      if (data.message) {
        chatObject.messageBody = data.message;
      } else {
        chatObject.image = true;
        chatObject.imageUrl = "http://localhost:3000/" + data.imageUrl;
      }
      console.log("url " + chatObject.imageUrl);

      if (data.isGroup) {
        chatObject.isGroup = true;
        vm.groupChatLogs[data.ToUserName].push(chatObject);
        // console.log("group Chat");
        // console.log(vm.groupChatLogs);

        if (vm.chatUser.firstName == data.ToUserName)
          vm.Messages = vm.groupChatLogs[data.ToUserName];
        $scope.$watch('vm.Messages', function (newVal, oldVal) {
          $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
        });
      } else {
        vm.chatLogs[x].push(chatObject);
        if (vm.chatUser.firstName == data.FromUserName) {
          vm.Messages = vm.chatLogs[x];
          $scope.$watch('vm.Messages', function (newVal, oldVal) {
            $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
          });
        } else {
          angular.forEach(vm.Friends, function (value, key) {

            if (vm.Friends[key].firstName == data.FromUserName) {
              vm.Friends[key].color = 'yellow';
            }
          });
        }
      }
    });

    Socket.on('is typing', function (data) {
      angular.forEach(vm.Friends, function (value, key) {
        if (vm.Friends[key].firstName == data.FromUserName) {
          vm.Friends[key].isTyping = data.isTyping;
        }
      });
    });

    Socket.on('user left', function (data) {

      var x = data.username;

      angular.forEach(vm.Friends, function (value, key) {

        if (vm.Friends[key].firstName == x) {
          vm.Friends.splice(key, 1);
          if (vm.chatUser.firstName == x)
            vm.chatUser.hasLeft = true;
        }
      });
      notifyMesage = x + " has left the web chat!!!";
      notify({message: notifyMesage, duration: '3000', position: 'center'});
    });

    //image handling
    vm.uploadFile = function (file, invalidFile) {
      // vm.user.file = file;
      // vm.user.errorFile = invalidFile && invalidFile[0];
      // console.log("Uploaded");
      console.log(file);
      if (file) {
        file.upload = Upload.upload({
          url: '/UploadedFiles',
          data: {
            file: file,
            FromUserName: vm.user.firstName,
            ToUserName: vm.chatUser.firstName
          }
        });
        var chatObject = {
          time: $filter('date')(new Date(), 'hh:mm a, EEE'),
          firstName: vm.user.firstName,
          image: true,
          imageFile: file
        };
        // console.log(file);
        vm.chatLogs[vm.chatUser.firstName].push(chatObject);
        vm.Messages = vm.chatLogs[vm.chatUser.firstName];
        $scope.$watch('vm.Messages', function (newVal, oldVal) {
          $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
        });

        file.upload.then(function (response) {
          console.log("file uploaded");
          console.log(response);

          file.result = response.data;
        }, function (response) {
          console.log("file upload failed");

          if (response.status > 0)
            chatObject.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
          chatObject.progress = Math.min(100, parseInt(100.0 *
            evt.loaded / evt.total));
        });
      }
    };

  }])
  .factory('Socket', ['socketFactory', function (socketFactory) {
    return socketFactory();
  }])
  .directive('username', function ($q, $http) {
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        ctrl.$asyncValidators.username = function (modelValue, viewValue) {

          var def = $q.defer();
          $http({
            url: '/checkAvailability',
            method: "GET",
            params: {userName: viewValue}
          }).then(function (response) {
            console.log(response);
            if (response.data.Access == true)
              def.resolve();
            else
              def.reject();
          });
          return def.promise;
        };
      }
    };
  });

