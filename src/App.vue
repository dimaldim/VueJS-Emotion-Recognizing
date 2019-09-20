<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span class="font-weight-light">Kids Social Skills</span>
      </v-toolbar-title>
    </v-app-bar>

    <v-dialog v-model="isLoading" fullscreen>
      <v-container fluid fill-height style="background-color: rgba(255, 255, 255, 0.5);">
        <v-layout justify-center align-center>
          <v-progress-circular
                  indeterminate
                  color="primary">
          </v-progress-circular>
        </v-layout>
      </v-container>
    </v-dialog>

    <v-content>
        <router-view />
    </v-content>

    <v-footer padless>
      <v-col
              class="text-center"
              cols="12"
      >
        {{ new Date().getFullYear() }} — <strong>Kids Social Skills</strong>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>
  import { mapGetters } from 'vuex'

export default {
  name: 'App',
  components: {
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
            'isLoading'
    ])
  }
};
</script>
