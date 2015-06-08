var elixir, bowerPath, paths, coreScripts, angularLibScripts;

elixir = require('laravel-elixir');
bowerPath = './vendor/bower_components/';
paths = {
	bootstrap: bowerPath + 'bootstrap/',
	jquery: bowerPath + 'jquery/dist/'
}
//Core script
coreScripts = [
	paths.jquery + 'jquery.js',

	//List of used bootstrap js script
	paths.bootstrap + 'js/collapse.js',
	paths.bootstrap + 'js/dropdown.js',
	paths.bootstrap + 'js/modal.js'
];

angularLibScripts = [
	bowerPath+'angular-loader/angular-loader.js',
	bowerPath+'angular/angular.js',
	bowerPath+'angular-mocks/angular-mocks.js',
	bowerPath+'angular-resource/angular-resource.js',
	bowerPath+'angular-route/angular-route.js'
]

//Load laravel elixir npm package
require('laravel-elixir-angular');

/*
 |--------------------------------------------------------------------------
 | Elixir Asset Management
 |--------------------------------------------------------------------------
 |
 | Elixir provides a clean, fluent API for defining some basic Gulp tasks
 | for your Laravel application. By default, we are compiling the Less
 | file for our application, as well as publishing vendor resources.
 |
 */

elixir(function(mix) {
	mix.less('app.less')
		//Copy bootstrap fonts
	    .copy(paths.bootstrap + 'fonts/**', './public/fonts')
	    //Register core scripts
	    .scripts(coreScripts, 'public/js/main.js', './')
	    .scripts(angularLibScripts, 'public/js/angular.js', './')
	    .angular('resources/assets/angular/home/', 'public/js/angular','home-app.js');
});
