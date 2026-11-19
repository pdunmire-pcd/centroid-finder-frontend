# Mock media

| File | What it is |
| --- | --- |
| `sample.mp4` | Bright balloon sample video (4 MB), used by automated tests |
| `salamander.mp4` | First 30 s of `ensantina.mp4` (816×720, 23.976 fps, no audio) |
| `salamander-thumbnail.jpg` | First frame of `salamander.mp4` |
| `salamander-result.csv` | Real JAR output for `salamander.mp4` with target color `420500`, threshold `60` (720 rows, no header) |

Re-create the salamander files from the backend repo's `processor/` folder:

```bash
ffmpeg -ss 0 -i sampleInput/ensantina.mp4 -t 30 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart salamander.mp4
java -jar target/videoprocessor.jar salamander.mp4 salamander-result.csv 420500 60
```
