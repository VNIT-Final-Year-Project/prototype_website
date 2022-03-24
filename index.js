const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
let tic = 0;
let pause = false;
let song = "";
const recordAudio = () =>
  new Promise(async (resolve) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    const start = () => mediaRecorder.start();

    const stop = () =>
      new Promise((resolve) => {
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, {
            type: "audio/wav; codecs=0",
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          const play = () => audio.play();

          resolve({ audioBlob, audioUrl, play });
        });
        tic = Date.now();
        mediaRecorder.stop();
      });

    resolve({ start, stop });
  });

async function record() {
  const button = document.getElementById("syncButton");
  button.disabled = true;
  const recorder = await recordAudio();
  recorder.start();
  await sleep(5000);
  const audio = await recorder.stop();

  const form = new FormData();

  form.append("blob", audio.audioBlob);

  form.append("song", song);
  axios
    .post("http://192.168.1.7:5000/sync", form, {
      headers: { "content-type": "multipart/form-data" },
    })
    .then((res) => {
      console.log(res);

      var audio = document.getElementById("audio");
      const audiosrc = "http://192.168.1.7:8080\\" + song;
      console.log(audiosrc);

      audio.crossOrigin = "anonymous";
      audio.src = audiosrc;
      audio.play();
      audio.currentTime = res.data.syncPoint + 0.1 + (Date.now() - tic) / 1000;
    });
  button.disabled = false;
}

async function detect() {
  const button = document.getElementById("detectButton");
  button.disabled = true;
  const recorder = await recordAudio();
  recorder.start();
  await sleep(5000);
  const audio = await recorder.stop();

  axios
    .post("http://192.168.1.7:5000/", audio.audioBlob, {
      headers: { "content-type": audio.audioBlob.type },
    })
    .then((res) => {
      console.log(res);
      song = res.data;
      document.getElementById("songTitle").innerHTML = song;
    });
  button.disabled = false;
}

function toggle() {
  var audio = document.getElementById("audio");
  const button = document.getElementById("toggleButton");
  if (pause) {
    button.textContent = "Pause";
    audio.play();
    pause = false;
  } else {
    button.textContent = "Resume";
    audio.pause();
    pause = true;
  }
}
