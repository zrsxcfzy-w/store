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
    variant: {
      type: String,
      value: "default"
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
    },
    highlightStyle: {
      type: String,
      value: ""
    },
    cardStyle: {
      type: String,
      value: ""
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
