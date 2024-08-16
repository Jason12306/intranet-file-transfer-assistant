import { defineStore } from "pinia";

export const useAppStore = defineStore("appStore", {
  state: () => {
    return {
      foo: "foo",
    };
  },
  getters: {
    fooGet: (state) => "from getters: " + state.foo,
  },
  actions: {
    setUserInfoIsUpdate(foo: string) {
      this.foo = foo;
    },
  },
});
