//'use strict';

var app = angular.module("myApp", []);
app.controller("myCtrl", function ($scope) {
    $scope.records = [{ key: "k1", value: 'v1' }, { key: "k2", value: 'v2' }];
    $scope.firstName = "John";
    $scope.lastName = "Doe";
});