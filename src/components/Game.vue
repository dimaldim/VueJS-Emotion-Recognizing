<template>
  <v-container>
    <v-row v-if="error">
      <v-col>
        <v-alert outlined type="error" prominent border="left">
          It seems there is a problem with your web cam. Please check whether
          your web cam is working and try again.
        </v-alert>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col>
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

        <v-select
          :items="devices"
          v-model="camera"
          label="Select Device"
          item-text="label"
          item-value="deviceId"
        ></v-select>

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
    <v-row class="text-center" v-if="myExpression.length && !myExpressionError.length">
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
    ...mapGetters(["isLoading", "gamePoints"]),
    device: function() {
      return this.devices.find(n => n.deviceId === this.deviceId);
    },
    userAnswerClass: function() {
      return {
        alert: true,
        "alert-danger": !this.isAnswerRight,
        "alert-success": this.isAnswerRight,
        "alert-dismissible": true,
        "fade show": true
      };
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
    ...mapActions(["changeIsLoading", "addPoints"]),
    textToSpeech(text) {
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
      this.changeIsLoading();
      this.resetState();
      this.img = this.$refs.webcam.capture();
      const myImg = document.getElementById("my_img");

      await faceapi.nets.tinyFaceDetector.loadFromUri("/data/weights");
      await faceapi.nets.faceExpressionNet.loadFromUri("/data/weights");
      const detections = await faceapi
        .detectAllFaces(myImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (!detections.length) {
        this.myExpressionError = "Cannot find face or detect expressions";
      } else {
        this.expressions = {
          happy: detections[0].expressions.happy,
          angry: detections[0].expressions.angry,
          sad: detections[0].expressions.sad,
          surprised: detections[0].expressions.surprised,
          neutral: detections[0].expressions.neutral
        };
        this.myExpression = this.findMyEmotion(this.expressions);
        this.myExpressionError = "";
      }
      this.changeIsLoading();
    },
    onError(error) {
      this.error = error;
    },
    onCameras(cameras) {
      this.devices = cameras;
    },
    onCameraChange(deviceId) {
      this.deviceId = deviceId;
      this.camera = deviceId;
    },
    findMyEmotion(obj) {
      return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
    },
    checkEmotion(emotion) {
      this.userAnswer = emotion;
      this.isAnswerRight = emotion == this.myExpression;
      if (emotion == this.myExpression) {
        this.addPoints(1);
        this.textToSpeech(
          `Yes, I’m ${this.userAnswer}. Can you make the same face?`
        );
      } else {
        this.textToSpeech(
          `Sorry, but I'm not ${this.userAnswer}. Please try again.`
        );
      }
    },
    resetState() {
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
