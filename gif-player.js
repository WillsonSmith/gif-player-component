import { LitElement, html, css } from "lit";
import { GifReader } from "omggif";
import { parseGIF, decompressFrames } from "gifuct-js";

class GifPlayer extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;
  }
  static get properties() {
    return {
      src: { type: String },
      alt: { type: String },
      autoplay: { type: Boolean },
      play: { type: Function },
      pause: { type: Function },
      restart: { type: Function },
      currentFrame: { type: Number },
      frames: { attribute: false, type: Array },
      playing: { attribute: false, type: Boolean },
      width: { attribute: false, type: Number },
      height: { attribute: false, type: Number },
    };
  }

  constructor() {
    super();
    this.currentFrame = 0;
    this.frames = [];
    this.step = this.step();
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
    this.loadSource = this.loadSource.bind(this);
  }

  firstUpdated() {
    this.canvas = this.renderRoot.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    this.loadSource(this.src).then(() => {
      if (this.autoplay) this.play();
    });
  }

  updated(changedProperties) {
    if (changedProperties.has("width")) {
      this.canvas.width = this.width;
      this.renderFrame(false);
    }
    if (changedProperties.has("height")) {
      this.canvas.height = this.height;
      this.renderFrame(false);
    }
  }

  render() {
    return html`<canvas role="img" aria-label=${this.alt}></canvas>`;
  }

  play() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(this.step);
    this.playing = true;
  }

  pause() {
    this.playing = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  restart() {
    this.currentFrame = 0;
    if (this.playing) {
      this.play();
    } else {
      this.pause();
      this.renderFrame(false);
    }
  }

  step() {
    let previousTimestamp;
    return (timestamp) => {
      if (!previousTimestamp) previousTimestamp = timestamp;
      const delta = timestamp - previousTimestamp;
      const delay = this.frames[this.currentFrame]?.delay;
      if (this.playing && delay && delta > delay) {
        previousTimestamp = timestamp;
        this.renderFrame();
      }
      this.animationFrame = requestAnimationFrame(this.step);
    };
  }

  renderFrame(progress = true) {
    if (!this.frames.length) return;
    if (this.currentFrame === this.frames.length - 1) {
      this.currentFrame = 0;
    }
    const frame = this.frames[this.currentFrame];
    this.context.putImageData(frame.image, 0, 0);
    if (progress) {
      this.currentFrame = this.currentFrame + 1;
    }
  }

  async loadSource(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const parsedGif = parseGIF(buffer);
    const gif = gifData(parsedGif);
    const { width, height, frames } = gif;
    this.width = width;
    this.height = height;
    this.frames = frames;
    if (!this.alt) {
      this.alt = url;
    }
    this.renderFrame(false);
  }
}

function gifData(gif) {
  const decompressedFrames = decompressFrames(gif, true);
  const {
    lsd: { width, height },
  } = gif;
  const frames = Array.from(frameDetails(decompressedFrames, width, height));
  return { width, height, frames };
}

function* frameDetails(frames, width, height) {
  const currentFrameCanvas = document.createElement("canvas");
  const currentFrameCanvasContext = currentFrameCanvas.getContext("2d");
  const combinedFrameCanvas = document.createElement("canvas");
  const combinedFrameCanvasContext = combinedFrameCanvas.getContext("2d");
  currentFrameCanvas.width = width;
  currentFrameCanvas.height = height;
  combinedFrameCanvas.width = width;
  combinedFrameCanvas.height = height;

  for (const frame of frames) {
    const { delay, patch, disposalType } = frame;

    /** Create new ImageData for the current frame */
    const imageData = currentFrameCanvasContext.createImageData(width, height);

    /** Set imageData to the new frame's patch */
    imageData.data.set(patch, 0, 0);

    // if disposalType 2 -> clear canvas
    /** If disposalType is 2, clear the final frame */
    if (disposalType === 2) {
      combinedFrameCanvasContext.clearRect(0, 0, width, height);
    }

    /** Assemble the final frame */
    currentFrameCanvasContext.putImageData(imageData, 0, 0);
    /** Draw the new data to the combined canvas */
    combinedFrameCanvasContext.drawImage(currentFrameCanvas, 0, 0);
    yield {
      image: combinedFrameCanvasContext.getImageData(0, 0, width, height),
      delay,
    };
  }
}

customElements.define("gif-player", GifPlayer);
