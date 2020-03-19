import Gue from "./gue";

const firstGue = new Gue({
  data() {
    return {
      someString: "Gue Test",
      happy: "happy"
    }
  },
  computed: {
    fixed() {
      return this.someString + this.happy;
    }
  },
  watch: {
    fixed(newValue, oldValue) {
      console.log("Watch!fixed", newValue, oldValue, this.someString);
    },
    someString(newValue, oldValue) {
      console.log("Watch!someString", newValue, oldValue);
    }
  }
}).$mount("#app");

window && (window.firstGue = firstGue);