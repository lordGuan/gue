import Gue from "./gue";

const firstGue = new Gue({
  data() {
    return {
      someString: "Gue Test"
    }
  },
  computed: {
    fixed() {
      return this.someString + "test";
    }
  }
}).$mount("#app");

window && (window.firstGue = firstGue);