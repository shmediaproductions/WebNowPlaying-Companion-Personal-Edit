//Adds support for the new youtube layout
/*global init createNewMusicInfo createNewMusicEventHandler convertTimeToString capitalize*/

var lastImgVideoID = "";
var lastAlbumVideoID = "";
var currIMG = "";
var currCategory = "";
var wasMadeVisable = false;

function setupNew() {
    var youtubeInfoHandler = createNewMusicInfo();

    youtubeInfoHandler.player = function () {
        return "YouTube";
    };

    youtubeInfoHandler.readyCheck = function () {
        let title = document.getElementsByClassName("ytd-video-primary-info-renderer title");
        return title?.length > 0 && title[0].innerText?.length > 0;
    };

    youtubeInfoHandler.state = function () {
        let video = document.getElementsByClassName("html5-main-video")[0];
        var state = video.paused ? 2 : 1;
        if (document.getElementsByClassName("ytp-play-button")[0].getAttribute("aria-label") === null) {
            state = 3;
        }
        //It is possible for the video to be "playing" but not started
        if (state == 1 && video.played.length <= 0) {
            state = 2;
        }
        return state;
    };
    youtubeInfoHandler.title = function () {
        return document.getElementsByClassName("ytd-video-primary-info-renderer title")[0].innerText;
    };
    youtubeInfoHandler.artist = function () {
        return document.querySelector("#upload-info yt-formatted-string.ytd-channel-name").innerText;
    };
    youtubeInfoHandler.album = function () {
        //If using a playlist just use the title of that
        let playlist = document.getElementsByClassName("ytd-playlist-panel-renderer title")[0];
        if (playlist.innerText !== "") {
            return playlist.innerText;
        }

        //If video has a "Buy or Rent" module use the displayed title & year
        let offer = document.getElementById("offer-module");
        if (offer?.children.length) {
            let info = offer.querySelector("#info"),
                title = offer.querySelector("#title"),
                result,
                year;

            if (title?.innerText.length > 0) {
                if (info) {
                    let released = document.evaluate("//yt-formatted-string[text()='Released']", info, null, XPathResult.ANY_TYPE, result).iterateNext();
                    let module = released?.parentElement;
                    year = module?.querySelector("[title]");
                    currCategory = year?.innerText?.length > 0 ? `${title?.innerText} (${year?.innerText})` : title?.innerText;
                } else {
                    currCategory = title?.innerText;
                }
                return currCategory;
            }
        }

        //If playing a video with a hashtag use that
        if (document.getElementsByClassName("super-title")[0].children.length > 0) {
            return document.getElementsByClassName("super-title")[0].children[0].innerText;
        }

        //Check if the secondary info has a category and is visible
        let info2nd = document.getElementsByClassName("sticky ytd-video-secondary-info-renderer")[0];
        if (
            info2nd?.innerText.length > 0 &&
            info2nd?.children[0].children.length > 0
        ) {
            //Return category if visible else
            try {
                var title = info2nd?.querySelectorAll("#title")[0];
                var subtitle = info2nd?.querySelectorAll("#subtitle")[0];
                var category = info2nd?.querySelectorAll("#title")[1];
                var catsub = info2nd?.querySelectorAll("#subtitle")[1];
            } catch (e) {
                return currCategory;
            }
            if (title?.hidden == false && subtitle?.hidden == false) {
                currCategory = `${title?.innerText} (${subtitle?.innerText})`;
            } else if (title?.hidden == false) {
                currCategory = title?.innerText;
            } else if (category?.hidden == false && catsub?.hidden == false) {
                currCategory = `${category?.innerText} (${catsub?.innerText})`;
            } else if (category?.hidden == false) {
                currCategory = category?.innerText;
            }
            return currCategory;
        }
        //Return no album/last category
        return currCategory;
    };
    youtubeInfoHandler.cover = function () {
        var url = new URL(window.location.href).search;
        var videoID = new URLSearchParams(url).get("v");

        if (lastImgVideoID !== videoID && videoID) {
            lastImgVideoID = videoID;
            const strr = "https://i.ytimg.com/vi/";
            var img = document.createElement("img"),
                qual = "/maxresdefault.jpg?";
            img.setAttribute("src", strr + videoID + qual);
            img.addEventListener("load", function () {
                if (img.height > 90) {
                    currIMG = strr + videoID + qual;
                } else {
                    currIMG = strr + videoID + "/hqdefault.jpg?";
                }
            });
            img.addEventListener("error", function () {
                if (img.src.includes("maxresdefault")) {
                    qual = "/hqdefault.jpg?";
                    currIMG = strr + videoID + qual;
                } else if (img.src.includes("hqdefault")) {
                    qual = "/mqdefault.jpg?";
                    currIMG = strr + videoID + qual;
                } else if (img.src.includes("mqdefault")) {
                    qual = "/maxresdefault.jpg?";
                    currIMG = strr + lastImgVideoID + qual;
                }
                img.setAttribute("src", strr + videoID + qual);
            });
        }

        return currIMG;
    };
    youtubeInfoHandler.durationString = function () {
        return document.getElementsByClassName("ytp-time-duration")[0].innerText;
    };
    youtubeInfoHandler.position = function () {
        return document.getElementsByClassName("html5-main-video")[0].currentTime;
    };
    youtubeInfoHandler.volume = function () {
        return document.getElementsByClassName("html5-main-video")[0].volume;
    };
    youtubeInfoHandler.rating = function () {
        let buttons = document.getElementById("menu-container").getElementsByTagName("ytd-toggle-button-renderer");
        //Check if thumbs button is active
        if (buttons[0]?.classList.contains("style-default-active")) {
            return 5; // thumbs up
        }
        if (buttons[1]?.classList.contains("style-default-active")) {
            return 1; // thumbs down
        }
        return 0;
    };
    youtubeInfoHandler.repeat = function () {
        if (document.getElementsByClassName("html5-main-video")[0].loop == true) {
            return 2;
        }
        let menu = document.getElementById("playlist-action-menu");
        if (menu.children?.length > 0) {
            return menu.getElementsByTagName("ytd-toggle-button-renderer")[0].classList.contains("style-default-active") ? 1 : 0;
        }
        return 0;
    };
    youtubeInfoHandler.shuffle = function () {
        let menu = document.getElementById("playlist-action-menu");
        if (menu.children.length > 0) {
            return menu.getElementsByTagName("ytd-toggle-button-renderer")[1].classList.contains("style-default-active") ? 1 : 0;
        }
        return 0;
    };

    var youtubeEventHandler = createNewMusicEventHandler();

    //Define custom check logic to make sure you are not trying to update info when nothing is playing
    youtubeEventHandler.readyCheck = null;

    youtubeEventHandler.playpause = function () {
        document.getElementsByClassName("ytp-play-button")[0]?.click();
    };
    //@TODO implement tab handling
    youtubeEventHandler.next = function () {
        let next = document.getElementsByClassName("ytp-next-button")[0],
            playlist = document.getElementsByClassName("playlist-items")[0];
        if (!document.getElementById("playlist") || !document.getElementById("playlist").hasAttribute("has-playlist-buttons")) {
            next.click();
        } else if (currShuffle == 1) {
            playlist.children[Math.floor(Math.random() * playlist.children.length)].querySelector("#meta")?.click();
        } else {
            if (!playlist.lastElementChild?.hasAttribute("selected")) {
                playlist.querySelector("#playlist-items[selected]").nextSibling.querySelector("#meta")?.click();
            } else {
                if (document.getElementById("playlist-action-menu")?.getElementsByTagName("ytd-toggle-button-renderer")[0]?.classList.contains("style-default-active")) {
                    playlist.firstElementChild.querySelector("#meta").click();
                } else {
                    next.click();
                }
            }
        }
    };
    youtubeEventHandler.previous = function () {
        let video = document.getElementsByClassName("html5-main-video")[0],
            previous = document.getElementsByClassName("ytp-prev-button")[0];
        if (previous?.getAttribute("aria-disabled") == "false") {
            previous.click();
        } else {
            if (video.currentTime <= 3) {
                history.back();
            } else {
                video.currentTime = 0;
            }
        }
    };
    youtubeEventHandler.progressSeconds = function (position) {
        document.getElementsByClassName("html5-main-video")[0].currentTime = position;
    };
    youtubeEventHandler.volume = function (volume) {
        let video = document.getElementsByClassName("html5-main-video")[0];
        if (video.muted && volume > 0) {
            video.muted = false;
        } else if (volume == 0) {
            video.muted = true;
        }
        video.volume = volume;
    };
    youtubeEventHandler.repeat = function () {
        let video = document.getElementsByClassName("html5-main-video")[0];
        //If no repeat button on the page then use video's loop element to loop the video
        if (!document.getElementById("playlist") || !document.getElementById("playlist").hasAttribute("has-playlist-buttons")) {
            video.loop = !video.loop;
        } else {
            let repeatButton = document.getElementById("playlist-action-menu").getElementsByTagName("ytd-toggle-button-renderer")[0];
            //Each if is a different state, first is loop none, second is loop one, last is loop all order triggered is still the usual none->all->one
            if (video.loop) {
                video.loop = false;
                if (repeatButton?.classList.contains("style-default-active")) {
                    repeatButton.click();
                }
            } else if (repeatButton?.classList.contains("style-default-active")) {
                video.loop = true;
            } else {
                repeatButton?.click();
            }
        }
    };
    youtubeEventHandler.shuffle = function () {
        let menu = document.getElementById("playlist-action-menu"),
            shuffleButton = menu.getElementsByTagName("ytd-toggle-button-renderer")[1];
        if (menu.children.length > 0) {
            shuffleButton?.click();
        }
    };
    youtubeEventHandler.toggleThumbsUp = function () {
        document.getElementById("menu-container").getElementsByTagName("ytd-toggle-button-renderer")[0]?.click();
    };
    youtubeEventHandler.toggleThumbsDown = function () {
        document.getElementById("menu-container").getElementsByTagName("ytd-toggle-button-renderer")[1]?.click();
    };
    youtubeEventHandler.rating = function (rating) {
        let buttons = document.getElementById("menu-container").getElementsByTagName("ytd-toggle-button-renderer");
        if (rating > 3) {
            buttons[0]?.click();
        } else if (rating < 3) {
            buttons[1]?.click();
        }
    };
}
