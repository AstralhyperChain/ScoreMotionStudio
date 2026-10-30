import { ScoreData } from '../types/score';
import { VisualizerPreset } from '../types/visualizer';
import { MidiVisualizerRenderer } from '../render/midiVisualizerRenderer';

export interface ExportProgress {
  isExporting: boolean;
  progressPercent: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  estimatedRemainingSec: number;
  downloadUrl: string | null;
  error: string | null;
}

export class VideoExportEngine {
  /**
   * Generates production FFmpeg CLI command for native desktop rendering
   */
  public static generateFFmpegCommand(
    score: ScoreData,
    width: number,
    height: number,
    fps: number,
    bitrateMbps: number
  ): string {
    const filename = `${score.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${width}x${height}_${fps}fps.mp4`;
    return `ffmpeg -y -f lavfi -i anullsrc=r=48000:cl=stereo -r ${fps} -s ${width}x${height} -t ${Math.ceil(score.duration)} -c:v libx264 -preset slow -crf 17 -b:v ${bitrateMbps}M -pix_fmt yuv420p "exports/${filename}"`;
  }

  /**
   * Deterministic Offline Frame Renderer
   * Renders every frame at exact intervals (1 / fps) without timing drift,
   * capturing video stream using MediaRecorder into a downloadable file.
   */
  public static async renderDeterministicVideo(
    score: ScoreData,
    preset: VisualizerPreset,
    width: number,
    height: number,
    fps: number,
    onProgress: (p: ExportProgress) => void
  ): Promise<string> {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not create offscreen Canvas 2D context.');

    const renderer = new MidiVisualizerRenderer();
    const duration = score.duration;
    const totalFrames = Math.ceil(duration * fps);
    const frameInterval = 1 / fps;

    // Set up canvas capture stream and MediaRecorder
    const stream = offscreen.captureStream(fps);
    const mimeTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm',
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMime || undefined,
      videoBitsPerSecond: 25_000_000, // 25 Mbps
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.start(100);

    const startTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      const curTime = frame * frameInterval;

      // Deterministic render
      renderer.render(ctx, width, height, score, curTime, preset);

      // Report progress every 15 frames or at the end
      if (frame % 15 === 0 || frame === totalFrames - 1) {
        const percent = Math.round(((frame + 1) / totalFrames) * 100);
        const elapsedSec = (performance.now() - startTime) / 1000;
        const rate = (frame + 1) / Math.max(0.1, elapsedSec);
        const remainingFrames = totalFrames - (frame + 1);
        const estSec = Math.round(remainingFrames / Math.max(1, rate));

        onProgress({
          isExporting: true,
          progressPercent: percent,
          currentFrame: frame + 1,
          totalFrames,
          estimatedRemainingSec: estSec,
          downloadUrl: null,
          error: null,
        });

        // Yield to browser event loop
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: selectedMime || 'video/mp4' });
        const url = URL.createObjectURL(blob);

        onProgress({
          isExporting: false,
          progressPercent: 100,
          currentFrame: totalFrames,
          totalFrames,
          estimatedRemainingSec: 0,
          downloadUrl: url,
          error: null,
        });

        // Trigger automatic download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${score.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_visualization.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        resolve(url);
      };

      recorder.stop();
    });
  }
}
