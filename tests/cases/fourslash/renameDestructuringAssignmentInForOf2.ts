/// <reference path='fourslash.ts' />

////interface I {
////    property1: number;
////    property2: string;
////}
////var elems: I[];
////
////var [|property1|]: number, p2: number;
////for ({ [|property1|] } of elems) {
////    [|property1|]++;
////}
////for ({ property1: p2 } of elems) {
////}

verify.rangesAreRenameLocations();
