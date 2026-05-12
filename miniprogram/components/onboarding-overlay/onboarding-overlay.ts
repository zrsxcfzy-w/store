Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    target: {
      type: String,
      value: "center"
    },
    stepText: {
      type: String,
      value: ""
    },
    title: {
      type: String,
      value: ""
    },
    text: {
      type: String,
      value: ""
    },
    primaryText: {
      type: String,
      value: "下一步"
    },
    secondaryText: {
      type: String,
      value: "跳过"
    },
    showSecondary: {
      type: Boolean,
      value: true
    },
    finishMode: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onPrimaryTap() {
      (this as any).triggerEvent("primary");
    },

    onSecondaryTap() {
      (this as any).triggerEvent("secondary");
    },

    noop() {}
  }
});
