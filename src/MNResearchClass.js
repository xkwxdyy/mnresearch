function createMNResearchClass(mainPath) {
  const root = typeof globalThis !== "undefined" ? globalThis : this;
  const MNResearchClass = JSB.defineClass("MNResearch : JSExtension", {
    sceneWillConnect: function () {
      try {
        if (typeof MNUtil !== "undefined" && MNUtil && typeof MNUtil.init === "function") {
          MNUtil.init(mainPath);
        }

        MNResearchConfig.init(mainPath);
        root.MNResearchInstance = self;
        MNUtil.addObserver(self, "onAddonBroadcast:", "AddonBroadcast");
        MNResearchClass.prototype.requestLiteratureReadingModeSync.call(self);
      } catch (error) {
        MNResearchUtils.addErrorLog(error, "sceneWillConnect");
      }
    },

    sceneDidDisconnect: function () {
      try {
        MNUtil.removeObserver(self, "AddonBroadcast");
      } catch (_) {}
    },
    sceneWillResignActive: function () {},
    sceneDidBecomeActive: function () {},
    notebookWillOpen: function () {},
    notebookWillClose: function () {},

    onAddonBroadcast: function (sender) {
      try {
        let message = "marginnote4app://addon/" + sender.userInfo.message;
        let config = MNUtil.parseURL(message);
        let addon = config.pathComponents[0];
        if (addon !== "mnresearch") {
          return;
        }

        let action = config.params.action;
        switch (action) {
          case "externalReadingModeChanged": {
            const raw = config.params.enabled;
            const enabled = raw === true || raw === 1 || raw === "1" || raw === "true";
            MNResearchClass.prototype.handleExternalReadingModeChanged.call(self, enabled, {
              source: config.params.source || addon || "mnliterature",
              bindingId: config.params.bindingId || config.params.noteId || config.params.id || "",
              reason: config.params.reason || "",
            });
            break;
          }
          default:
            break;
        }
      } catch (error) {
        MNResearchUtils.addErrorLog(error, "onAddonBroadcast");
      }
    },

    queryAddonCommandStatus: function () {
      MNResearchUtils.checkWebViewController();

      if (MNUtil.studyMode < 3) {
        return {
          image: "logo.png",
          object: self,
          selector: "toggleAddon:",
          checked: false,
        };
      }

      if (MNResearchUtils.webViewController) {
        MNResearchUtils.webViewController.view.hidden = true;
      }
      return null;
    },

    toggleAddon: async function (button) {
      try {
        if (!self.addonBar) {
          self.addonBar = button.superview.superview;
          MNResearchUtils.addonBar = self.addonBar;
        }

        await MNResearchClass.prototype.toggleResearchPanel.call(self);
      } catch (error) {
        MNResearchUtils.addErrorLog(error, "toggleAddon");
      }
    },

    openResearchPanel: async function () {
      await MNResearchClass.prototype.openResearchPanel.call(self);
    },

    exportResearchData: async function () {
      await MNResearchClass.prototype.exportResearchData.call(self);
    },

    importResearchData: async function () {
      await MNResearchClass.prototype.importResearchData.call(self);
    },

    backupResearchData: async function () {
      await MNResearchClass.prototype.backupResearchData.call(self);
    },
  });

  MNResearchClass.prototype.toggleResearchPanel = async function () {
    const controller = MNResearchUtils.checkWebViewController();
    const addonFrame = this.addonBar ? this.addonBar.frame : null;

    if (controller.onAnimate) {
      return;
    }

    if (!controller.view.hidden && !controller.miniMode) {
      controller.hide(addonFrame);
      return;
    }

    await this.openResearchPanel();
  };

  MNResearchClass.prototype.openResearchPanel = async function () {
    const controller = MNResearchUtils.checkWebViewController();
    const addonFrame = this.addonBar ? this.addonBar.frame : null;

    if (controller.currentHTMLType !== "research" || !controller.webViewLoaded) {
      controller.loadHTMLFile();
    }

    await controller.show(addonFrame);
  };

  MNResearchClass.prototype.requestLiteratureReadingModeSync = function () {
    try {
      MNUtil.postNotification("AddonBroadcast", {
        message: "mnliterature?action=syncReadingModeState&source=mnresearch",
      });
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "requestLiteratureReadingModeSync");
    }
  };

  MNResearchClass.prototype.handleExternalReadingModeChanged = function (
    enabled,
    options = {},
  ) {
    try {
      const payload = options && typeof options === "object" ? options : {};
      const bindingId = String(payload.bindingId || "").trim();
      const source = String(payload.source || "mnliterature").trim() || "mnliterature";
      const reason = String(payload.reason || "").trim();
      const literature =
        enabled &&
        bindingId &&
        root.MNResearchLiteratureAdapter &&
        typeof root.MNResearchLiteratureAdapter.findLiteratureById === "function"
          ? root.MNResearchLiteratureAdapter.findLiteratureById(bindingId)
          : null;
      const currentState = MNResearchConfig.loadStateData();
      const result = MNResearchConfig.applyExternalReadingModeToState(currentState, {
        enabled: !!enabled,
        bindingId,
        source,
        reason,
        literature,
      });

      if (!result || !result.changed) {
        return;
      }

      const saveOk = MNResearchConfig.saveStateData(result.state, {
        reason: "external-reading-sync",
        writeBackup: false,
      });
      if (!saveOk) {
        return;
      }

      const controller = MNResearchUtils.webViewController;
      if (controller && controller.webViewLoaded) {
        controller.deliverLoadedState(result.state, "external-reading-sync");
      }
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "handleExternalReadingModeChanged");
    }
  };

  MNResearchClass.prototype.exportResearchData = async function () {
    const state = MNResearchConfig.loadStateData();
    const filePath = MNResearchConfig.exportStateToFile(state);
    if (filePath) {
      MNUtil.showHUD("已导出研究数据");
    } else {
      MNUtil.showHUD("导出研究数据失败");
    }
  };

  MNResearchClass.prototype.importResearchData = async function () {
    const state = await MNResearchConfig.importStateFromFile();
    if (!state) {
      MNUtil.showHUD("未导入任何研究数据");
      return;
    }

    const writeOk = MNResearchConfig.saveStateData(state, {
      reason: "import",
      writeBackup: true,
    });
    if (!writeOk) {
      MNUtil.showHUD("导入研究数据失败");
      return;
    }

    const controller = MNResearchUtils.checkWebViewController();
    if (controller && controller.webViewLoaded) {
      controller.deliverLoadedState(state, "import");
    }
    MNUtil.showHUD("已导入研究数据");
  };

  MNResearchClass.prototype.backupResearchData = async function () {
    const state = MNResearchConfig.loadStateData();
    const backupOk = MNResearchConfig.saveBackupSnapshot(state, "manual-backup");
    if (!backupOk) {
      MNUtil.showHUD("备份研究数据失败");
      return;
    }

    const exportedPath = MNResearchConfig.exportStateToFile(state, "mnresearch-backup");
    if (exportedPath) {
      MNUtil.showHUD("已备份并导出研究数据");
    } else {
      MNUtil.showHUD("已写入本地备份，但导出失败");
    }
  };

  return MNResearchClass;
}
