angular.module('MyApp', ['btford.socket-io', 'MyApp.config', 'cgNotify', 'ui.router'])
  .controller('SignUpCtrl', ['$scope', '$state', function ($scope, $state) {
    var vm = this;
    vm.user = {};
    vm.submitForm = function () {
      console.log("Inside submit function");
      $state.go('ChatScreen', {'user': vm.user});
    };

  }])
  .controller('ChatCtrl', ['$scope', 'Socket', '$filter', '$stateParams', 'notify', '$timeout', function ($scope, Socket, $filter, $stateParams, notify, $timeout) {
    var vm = this;

    //The current user
    vm.user = $stateParams.user;

    //An array to hold all the messages in the chat box
    vm.Messages = [];

    //User's friends who are online and are shown active in the left bar
    vm.Friends = [];

    //The actuall chat box for sending private one to one messages
    vm.chatBox = false;

    //The user on the other side.
    vm.chatUser = {};

    //for storing chat history
    vm.chatLogs = {};


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

        var x = vm.chatUser.firstName;
        vm.chatLogs[x].push(chatObject);
        vm.Messages = vm.chatLogs[x];
        $scope.$watch('vm.Messages', function (newVal, oldVal) {
          $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
        });

        //4th event
        Socket.emit('new message', {
          FromUserName: vm.user.firstName,
          ToUserName: vm.chatUser.firstName,
          message: vm.userMessage
        });

        vm.userMessage = null;
      }
    }

    vm.sendMessage = function (event) {
      if (event.which === 13) {
        vm.messageDeliver();
      }
    };

    vm.ChatMessageCreation = function (friend) {
      vm.chatUser = friend;
      vm.chatUser.color = 'white';
      var x = friend.firstName;
      vm.Messages = vm.chatLogs[x];
      $scope.$watch('vm.Messages', function (newVal, oldVal) {
        $("#scrollBar").scrollTop($('#scrollBar')[0].scrollHeight);
      });

    };

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
        message: ''
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
        message: ''
      });
      notifyMesage = x + " has come online!!!";
      notify({message: notifyMesage, duration: '3000', position: 'center'});
    });

    //5th event
    Socket.on('new message', function (data) {

      var x = data.FromUserName;
      var chatObject = {
        time: $filter('date')(new Date(), 'hh:mm a, EEE'),
        firstName: data.FromUserName,
        messageBody: data.message
      };
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

    });

    Socket.on('user left', function (data) {

      var x = data.username;

      angular.forEach(vm.Friends, function (value, key) {

        if (vm.Friends[key].firstName == x) {
          vm.Friends.splice(key, 1);
        }
      });
      notifyMesage = x + " has left the web chat!!!";
      notify({message: notifyMesage, duration: '3000', position: 'center'});
    });

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

;
