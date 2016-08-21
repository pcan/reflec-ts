/// <reference path='fourslash.ts'/>

// @libFiles: reflection.d.ts
// @reflectionEnabled: true

////Refl/*1*/ection;
////interface Pluto{}
////class Pippo{}
////
////var x/*2*/ = Pippo.getClass();
////x.impleme/*3*/nts;
////var y/*4*/ = Pluto;


goTo.marker('1');
verify.quickInfoIs('namespace Reflection');

goTo.marker('2');
verify.quickInfoIs('var x: Class');

goTo.marker('3');
verify.quickInfoIs('(property) Class.implements: Interface[]');

goTo.marker('4');
verify.quickInfoIs('var y: Interface');
