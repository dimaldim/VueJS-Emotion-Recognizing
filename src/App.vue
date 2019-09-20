<template>
    <div class="container">
        <loading :active.sync="isLoading"
                 :can-cancel="true"
                 loader="dots"
                 :is-full-page="loaderFullPage"></loading>
        <router-view />
    </div>
</template>

<script>
    import Loading from 'vue-loading-overlay';
    import 'vue-loading-overlay/dist/vue-loading.css';
    import { mapGetters } from 'vuex'

 export default {
     name: 'App',
     data() {
         return {
         }
     },
     components: {
         Loading
     },
     computed: {
         ...mapGetters([
             'isLoading'
         ])
     }
 }
</script>

<style>
    body {
        padding: 0;
        margin: 0;
    }
</style>