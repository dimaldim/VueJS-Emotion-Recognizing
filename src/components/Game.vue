<template>
  <v-container>
    <!-- Show error if cannot detect user's web camera !-->
    <v-row v-if="error">
      <v-col>
        <v-alert outlined type="error" prominent border="left">
          It seems there is a problem with your web cam. Please check whether
          your web cam is working and try again.
        </v-alert>
      </v-col>
    </v-row>
    <!-- !-->
    <!-- Show camera, device select list and "Capture photo" button !-->
    <v-row v-else>
      <v-col>
        <!-- Display camera !-->
        <code v-if="device">{{ device.label }}</code>
        <vue-web-cam
          v-if="!error"
          ref="webcam"
          :device-id="deviceId"
          width="100%"
          @error="onError"
          @cameras="onCameras"
          @camera-change="onCameraChange"
        />
        <!-- Display "Select device" list !-->
        <v-select
          :items="devices"
          v-model="camera"
          label="Select Device"
          item-text="label"
          item-value="deviceId"
        ></v-select>
        <!-- Display "Capture photo" button !-->
        <div class="text-center">
          <v-btn
            small
            color="primary"
            @click="onCapture"
            :disabled="error !== null"
            >Capture photo
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <!-- !-->
    <!-- Display error if cannot recognize face or emotions !-->
    <v-row>
      <v-col>
        <v-img :src="img"></v-img>
        <img :src="img" id="my_img" style="display: none;" />
      </v-col>
    </v-row>
    <v-row v-if="myExpressionError.length">
      <v-col>
        <v-alert type="info">
          {{ myExpressionError }}
        </v-alert>
      </v-col>
    </v-row>
    <!-- !-->
    <!-- Display points, and emotions buttons !-->
    <v-row v-if="myExpression.length && !myExpressionError.length">
      <v-col>
        <v-alert
          color="cyan"
          border="left"
          elevation="2"
          colored-border
          icon="mdi-chess-queen"
        >
          You've got <strong>{{ gamePoints }}</strong> point(s)!
        </v-alert>
        <v-alert
          color="cyan"
          border="left"
          elevation="2"
          colored-border
          icon="mdi-help"
        >
          OK, Can you guess the emotion?
        </v-alert>
        <v-alert type="success" v-if="isAnswerRight && userAnswer.length">
          Yes, I’m {{ userAnswer }}. Can you make the same face?
        </v-alert>
        <v-alert type="error" v-if="!isAnswerRight && userAnswer.length">
          Sorry, but I'm not {{ userAnswer }}. Please try again.
        </v-alert>
      </v-col>
    </v-row>
    <v-row
      class="text-center"
      v-if="myExpression.length && !myExpressionError.length"
    >
      <v-col>
        <v-btn
          fab
          small
          color="primary"
          class="mr-3"
          @click="checkEmotion('happy')"
          :disabled="isAnswerRight"
        >
          <v-avatar>
            <img src="img/emoji3.jpg" alt="happy" />
          </v-avatar>
        </v-btn>
        <v-btn
          fab
          small
          color="primary"
          class="mr-3"
          @click="checkEmotion('angry')"
          :disabled="isAnswerRight"
        >
          <v-avatar>
            <img src="img/emoji5.jpg" alt="angry" />
          </v-avatar>
        </v-btn>
        <v-btn
          fab
          small
          color="primary"
          class="mr-3"
          @click="checkEmotion('sad')"
          :disabled="isAnswerRight"
        >
          <v-avatar>
            <img src="img/emoji2.jpg" alt="sad" />
          </v-avatar>
        </v-btn>
        <v-btn
          fab
          small
          color="primary"
          class="mr-3"
          @click="checkEmotion('surprised')"
          :disabled="isAnswerRight"
        >
          <v-avatar>
            <img src="img/emoji4.jpg" alt="surprised" />
          </v-avatar>
        </v-btn>
        <v-btn
          fab
          small
          color="primary"
          class="mr-3"
          @click="checkEmotion('neutral')"
          :disabled="isAnswerRight"
        >
          <v-avatar>
            <img src="img/emoji1.jpg" alt="neutral" />
          </v-avatar>
        </v-btn>
      </v-col>
    </v-row>
    <!-- !-->
  </v-container>
</template>

<script>
import { WebCam } from "vue-web-cam";
import * as faceapi from "face-api.js";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "App",
  components: {
    "vue-web-cam": WebCam
  },
  data() {
    return {
      img: "",
      camera: null,
      deviceId: null,
      devices: [],
      error: null,
      myExpressionError: "",
      isAnswerRight: false,
      userAnswer: "",
      expressions: {
        happy: 0,
        angry: 0,
        sad: 0,
        surprised: 0,
        neutral: 0
      },
      myExpression: ""
    };
  },
  computed: {
    /* Load store getters */
    ...mapGetters(["isLoading", "gamePoints"]),
    device: function() {
      return this.devices.find(n => n.deviceId === this.deviceId);
    }
  },
  watch: {
    camera: function(id) {
      this.deviceId = id;
    },
    devices: function() {
      // eslint-disable-next-line no-unused-vars
      const [first, ...tail] = this.devices;
      if (first) {
        this.camera = first.deviceId;
        this.deviceId = first.deviceId;
      }
    }
  },
  methods: {
    /* Load store actions */
    ...mapActions(["changeIsLoading", "addPoints"]),
    textToSpeech(text) {
      /*
      Load speechSynthesis library, it's used to speak given text.
      */
      if ("speechSynthesis" in window) {
        let synthesis = window.speechSynthesis;
        // Get the first `en` language voice in the list
        let voice = synthesis.getVoices().filter(function(voice) {
          return voice.lang === "en-US";
        })[0];
        // Create an utterance object
        var utterance = new SpeechSynthesisUtterance(text);
        // Set utterance properties
        utterance.voice = voice;
        utterance.pitch = 1.5;
        utterance.rate = 1;
        utterance.volume = 0.8;
        // Speak the utterance
        synthesis.speak(utterance);
      } else {
        console.log("Text-to-speech not supported.");
      }
    },
    async onCapture() {
      /*
      Triggers when "Capture photo" button is clicked.
      */
      this.changeIsLoading(); // show loading circle
      this.resetState(); // reset user state
      this.img = this.$refs.webcam.capture(); // capture photo
      const myImg = document.getElementById("my_img"); // this element is hidden, not visible by end user.

      await faceapi.nets.tinyFaceDetector.loadFromUri("/data/weights"); // load face models
      await faceapi.nets.faceExpressionNet.loadFromUri("/data/weights"); // load face expression models
      const detections = await faceapi
        .detectAllFaces(myImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions(); // detect face expressions
      /*
      If cannot detect face or face expressions throw error.
      */
      if (!detections.length) {
        this.myExpressionError = "Cannot find face or detect expressions";
      } else {
        /*
        If everything is ok - load expressions.
        */
        this.expressions = {
          happy: detections[0].expressions.happy,
          angry: detections[0].expressions.angry,
          sad: detections[0].expressions.sad,
          surprised: detections[0].expressions.surprised,
          neutral: detections[0].expressions.neutral
        };
        this.myExpression = this.findMyEmotion(this.expressions); // set myExpressions to detected emotion.
        this.myExpressionError = ""; // if any error - set to blank.
      }
      this.changeIsLoading(); // hide loading circle.
    },
    onError(error) {
      /*
      Load errors, if any.
      */
      this.error = error;
    },
    onCameras(cameras) {
      /*
      Load devices
      */
      this.devices = cameras;
    },
    onCameraChange(deviceId) {
      /*
      Change camera(device) on change in "Select device" list.
      */
      this.deviceId = deviceId;
      this.camera = deviceId;
    },
    findMyEmotion(obj) {
      /*
      Returns detected face emotion.
      */
      return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
    },
    checkEmotion(emotion) {
      /*
      Check user answer.
      This function decides whether user answer is correct based on the detected emotion.
      */
      this.userAnswer = emotion;
      this.isAnswerRight = emotion == this.myExpression;
      if (emotion == this.myExpression) {
        this.addPoints(1); // Add 1 point if user answer is correct
        this.textToSpeech(
          `Yes, I’m ${this.userAnswer}. Can you make the same face?`
        ); // Text-To-Speech
      } else {
        this.textToSpeech(
          `Sorry, but I'm not ${this.userAnswer}. Please try again.`
        ); // Text-To-Speech
      }
    },
    resetState() {
      /*
      Reset errors, user answer and face expressions
      It is used when new photo is captured.
       */
      this.myExpressionError = "";
      this.userAnswer = "";
      this.isAnswerRight = false;
      this.expressions = {
        happy: 0,
        angry: 0,
        sad: 0,
        surprised: 0,
        neutral: 0
      };
      this.myExpression = "";
    }
  }
};
</script>

<style scoped></style>
