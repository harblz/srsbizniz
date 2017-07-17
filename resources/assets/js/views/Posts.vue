<template>
    <div class="container">
        <div class="columns">
            <div class="column">
              <div class="content">


                <article class="media" v-for="status in statuses">

                  <figure class="media-left">
                    <p class="image is-64x64">
                      <img src="/images/128x128.png">
                    </p>
                  </figure>

                  <div class="media-content">
                    <div class="content">
                      <p>
                        <strong> {{ status.user.name }} </strong> <small> {{ status.user.email }} </small> — <small> {{ status.created_at | ago }} </small>
                        <br>
                        <div v-text="status.body"></div>
                      </p>
                    </div>

                    <nav class="level is-mobile">
                      <div class="level-left">
                        <a class="level-item">
                          <span class="icon is-small"><i class="fa fa-reply"></i></span>
                        </a>
                        <a class="level-item">
                          <span class="icon is-small"><i class="fa fa-retweet"></i></span>
                        </a>
                        <a class="level-item">
                          <span class="icon is-small"><i class="fa fa-heart"></i></span>
                        </a>
                      </div>
                    </nav>

                  </div>

                </article>


              </div>
            </div>
        </div>
    </div>
</template>

<script>
    import moment from 'moment';

    import Status from '../models/Status';

    export default {

        data() {
          return {
            statuses: []
          }
        },

        filters: {
          ago(date) {
            return moment(date).fromNow();
          }
        },

        methods: {
          postedOn(status) {
            return moment(status.created_at).local().fromNow();
          }
        },

        mounted() {
            document.getElementById('app').style.display = "block";
        },

        created() {
            Status.all( statuses => this.statuses = statuses );
        }
    }
</script>
