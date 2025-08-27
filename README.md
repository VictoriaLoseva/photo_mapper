# Welcome to photo mapper! 

This client-side webpage was originally created to visualise my progress on the 165-mile Tahoe Rim Trail, but it can be used to map any multi-day trip. 

To use, clone the repo and simply open index.html in your browser. Then select a directory with image files to upload. 

<img width="400" height="807" alt="screenshot of a map centered on Lake Tahoe, with marker pinned around the lake and a day selection timeline above the map" src="https://github.com/user-attachments/assets/1cfb1e51-73eb-43b3-a088-14f6646fa0c0" />

All file handling is done entirely client-side. Loading in the map tiles is the only use of internet connectivity in this project. 

The webpage has been tested on MacOs Firefox and Chrome. 



## Next steps: 
- Load in the map while the files are being processed for a smoother user experience 
    - On that note, add the pips appearing on the map in real time as they are being processed. It would look  cool.
- Progress bar should snap back w/o animation when new folder is being uploaded 
- Add the option to cache EXIF extraction results for faster reloading of a given directory 
