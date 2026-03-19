function createMNResearchClass(mainPath) {
  return JSB.defineClass(
    "MNResearchClass : JSExtension",
    {
      sceneWillConnect: function () {
        self.mainPath = mainPath;
        console.log("[MN Research] initialized");
      },
      sceneDidDisconnect: function () {
        console.log("[MN Research] disconnected");
      },
      queryAddonCommandStatus: function () {
        return {
          image: "icon.png",
          object: self,
          selector: "sayHello:",
          checked: false,
        };
      },
      sayHello: function () {
        console.log("[MN Research] Hello, MarginNote!");
      },
    },
  );
}
