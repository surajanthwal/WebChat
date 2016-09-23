angular
  .module('MyApp.config', ['ui.router'])
  .config(config)
  .run(function($state) {
    $state.go('SignUpScreen');
  });

function config ($stateProvider) {

  $stateProvider.
    state('SignUpScreen',{
    url:'/signUp',
    templateUrl:'SignUp/SignUpScreen.html',
    controller:'SignUpCtrl as vm'
  })
    .state('ChatScreen',{
    url:'/webChat',
    templateUrl:'ChatScreen/ChatScreen.html',
    controller:'ChatCtrl as vm',
    params: {
        'user': {}
    }
  });
}
