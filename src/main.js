JSB.require("mnutils");
JSB.require("utils");
JSB.require("mnliteratureAdapter");
JSB.require("researchWebController");
JSB.require("MNResearchClass");

JSB.newAddon = function (mainPath) {
  return createMNResearchClass(mainPath);
};
