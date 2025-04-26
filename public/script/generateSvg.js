const { getOutputCSS } = require("./tailwindCSS");

const request = require("request");
const fs = require("fs");

const downloadUserImg = (url, path) => {
    return new Promise((resolve, reject) => {
        request.head(url, (err, res, body) => {
            request(url)
                .pipe(fs.createWriteStream(path))
                .on("close", resolve)
                .on("error", reject);
        });
    });
};

const getUserImg = async (userData, theme) => {
    let userImg;
    let defaultUserImg = `
        <div class="h-20 w-20 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="${theme.subColor}">
                <path
                    d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z" />
            </svg>
        </div>
    `;
    if (
        userData === null ||
        userData.discordId === undefined ||
        userData.discordAvatar === undefined
    ) {
        userImg = defaultUserImg;
    } else {
        // Download the image and save it to a file
        const imagePath = `public/image/userImg/${userData.discordId}-${userData.discordAvatar}.png`;
        await downloadUserImg(
            `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?size=256`,
            imagePath,
        );

        // Convert the image file to base64
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString("base64");

        if (base64Image == "") {
            userImg = defaultUserImg;
        } else {
            userImg = `
                <div class="h-20 w-20 overflow-hidden rounded-full">
                    <img src="data:image/png;base64,${base64Image}" width="80" height="80" />
                </div>
            `;
        }
    }
    return userImg;
};

const getUserBadge = (badge, theme) => {
    let userBadge = "";
    if (badge !== null) {
        let color;
        if (badge.color === "white") color = "white";
        else color = theme[badge.color];

        badge.iconSvg = badge.iconSvg.replace('fill=""', `fill="${color}"`);
        userBadge = `
            <div class="flex w-fit items-center justify-center rounded-md p-1${
                badge.customStyle ? " animate-rgb-bg" : ""
            }" 
            ${
                badge.background
                    ? 'style="background: ' + theme[badge.background] + ';"'
                    : ""
            }>
                <div class="px-1">${badge.iconSvg}</div>
                <div class="px-1 align-middle font-mono text-xs" style="color: ${color};">
                    ${badge.name}
                </div>
            </div>
        `;
    }
    return userBadge;
};

const formatTopPercentage = (lbRank) => {
    if (!lbRank || lbRank.rank === undefined) return "-";
    if (!lbRank || lbRank.count === undefined) return "-";
    if (lbRank.rank === 1) return "GOAT";
    let percentage = (lbRank.rank / lbRank.count) * 100;
    let formattedPercentage =
        percentage % 1 === 0 ? percentage.toString() : percentage.toFixed(2);
    return "Top " + formattedPercentage + "%";
};

async function getOGSvg(userData, theme, badge) {
    const width = 500;
    const height = 200;
    const cssData = await getOutputCSS();

    let userImg = await getUserImg(userData, theme);
    let userBadge = getUserBadge(badge, theme);

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
            class="rounded-2xl">
            <style>
                ${cssData}
            </style>
            <foreignObject x="0" y="0" width="${width}" height="${height}">
                <div xmlns="http://www.w3.org/1999/xhtml">
                    <div class="w-full rounded-2xl" style="background-color: ${
                        theme.bgColor
                    }; height: 200px;">
                        <div class="flex h-full items-center justify-center">
                            <div class="pr-5">${userImg}</div>
                            <div>
                                <div class="font-mono text-3xl font-medium tracking-wider" style="color: ${
                                    theme.textColor
                                };">
                                    ${
                                        userData == null
                                            ? "user not found"
                                            : userData.name
                                    }
                                </div>
                                ${
                                    badge != null
                                        ? `<div class="py-1">${userBadge}</div>`
                                        : ``
                                }
                                ${
                                    userData && userData.streak > 0 ? `
                                        <div class="font-mono text-base font-medium tracking-wide" style="color: ${theme.subColor}; margin-top: 8px;">
                                            Current streak: ${userData.streak} days
                                        </div>
                                    ` : ``
                                }
                                </div>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </svg>
    `;
    return svg;
}

async function getSvg(userData, theme, badge, leaderBoards, personalbests) {
    const width = 900;
    const height = 260;
    const cssData = await getOutputCSS();

    let userImg = await getUserImg(userData, theme);
    let userBadge = getUserBadge(badge, theme);

    // Process personal bests data
    let pbTime = {};
    if (personalbests && userData && userData.personalBests && userData.personalBests.time) {
        for (let j = 15; j <= 120; j *= 2) {
            let english_1k = true;
            let english = true;
            let english_1k_pb = null;
            let english_pb = null;
            if (userData.personalBests.time[j] != undefined) {
                for (let i = 0; i < userData.personalBests.time[j].length; i++) {
                    if (
                        userData.personalBests.time[j][i].language == "english_1k" &&
                        userData.personalBests.time[j][i].difficulty == "normal" &&
                        userData.personalBests.time[j][i].punctuation == false &&
                        english_1k == true
                    ) {
                        english_1k_pb = userData.personalBests.time[j][i];
                        english_1k = false;
                    }
                    if (
                        userData.personalBests.time[j][i].language == "english" &&
                        userData.personalBests.time[j][i].difficulty == "normal" &&
                        userData.personalBests.time[j][i].punctuation == false &&
                        english == true
                    ) {
                        english_pb = userData.personalBests.time[j][i];
                        english = false;
                    }
                }
                if (english_1k_pb == null && english_pb == null) {
                    pbTime[j] = { wpm: "-", acc: "-" };
                } else if (english_1k_pb != null && english_pb == null) {
                    pbTime[j] = english_1k_pb;
                } else if (english_1k_pb == null && english_pb != null) {
                    pbTime[j] = english_pb;
                } else {
                    if (english_1k_pb.wpm > english_pb.wpm) {
                        pbTime[j] = english_1k_pb;
                    } else {
                        pbTime[j] = english_pb;
                    }
                }
            } else {
                pbTime[j] = { wpm: "-", acc: "-" };
            }
            if (pbTime[j].wpm != "-") {
                pbTime[j].wpm = Math.round(parseFloat(pbTime[j].wpm));
            }
            if (pbTime[j].acc != "-") {
                if (pbTime[j].acc == null || pbTime[j].acc == undefined) {
                    pbTime[j].acc = "-";
                } else {
                    pbTime[j].acc = Math.floor(parseFloat(pbTime[j].acc));
                }
            }
        }
    }

    // Colors for dark theme
    const pbLabelColor = theme.subColor || '#b0b8c9';
    const pbValueColor = theme.textColor || '#fff';
    const pbSubColor = theme.subColor || '#b0b8c9';

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
            class="rounded-2xl">
            <style>
                ${cssData}
            </style>
            <foreignObject x="0" y="0" width="${width}" height="${height}">
                <div xmlns="http://www.w3.org/1999/xhtml">
                    <div class="w-full rounded-2xl flex" style="background-color: ${theme.bgColor}; height: ${height}px;">
                        <!-- Profile section -->
                        <div class="flex flex-col items-center justify-center border-r" style="width: 260px; border-color: ${theme.subColor}; height: 100%;">
                            <div class="mb-4">${userImg}</div>
                            <div class="text-center">
                                <div class="font-mono text-2xl font-bold tracking-wider" style="color: ${theme.textColor}; letter-spacing: 0.05em;">
                                    ${userData == null ? "user not found" : userData.name}
                                </div>
                                ${badge != null ? `<div class="py-2">${userBadge}</div>` : ``}
                                ${userData && userData.streak > 0 ? `
                                    <div class="font-mono text-base font-medium tracking-wide" style="color: ${theme.subColor}; margin-top: 8px;">
                                        Current streak: ${userData.streak} days
                                    </div>
                                ` : ``}
                            </div>
                        </div>
                        <!-- PB section -->
                        <div class="flex flex-col justify-center flex-1 px-10">
                            <div class="font-mono text-2xl font-bold mb-4 text-center" style="color: ${pbValueColor}; letter-spacing: 0.04em;">Personal Records</div>
                            <div class="flex flex-row gap-10 justify-center items-center" style="min-width: 500px; max-width: 600px; margin: 0 auto;">
                                <div class="flex flex-col items-center justify-center" style="width: 120px;">
                                    <div class="font-mono text-lg font-semibold mb-1" style="color: ${pbLabelColor};">15s</div>
                                    <div class="font-mono text-3xl font-bold" style="color: ${pbValueColor};">${(pbTime["15"] && pbTime["15"].wpm) || "-"}</div>
                                    <div class="font-mono text-base mt-1" style="color: ${pbSubColor};">${(pbTime["15"] && pbTime["15"].acc) || "-"}${(pbTime["15"] && pbTime["15"].acc == "-") ? "" : "%"}</div>
                                </div>
                                <div class="flex flex-col items-center justify-center" style="width: 120px;">
                                    <div class="font-mono text-lg font-semibold mb-1" style="color: ${pbLabelColor};">30s</div>
                                    <div class="font-mono text-3xl font-bold" style="color: ${pbValueColor};">${(pbTime["30"] && pbTime["30"].wpm) || "-"}</div>
                                    <div class="font-mono text-base mt-1" style="color: ${pbSubColor};">${(pbTime["30"] && pbTime["30"].acc) || "-"}${(pbTime["30"] && pbTime["30"].acc == "-") ? "" : "%"}</div>
                                </div>
                                <div class="flex flex-col items-center justify-center" style="width: 120px;">
                                    <div class="font-mono text-lg font-semibold mb-1" style="color: ${pbLabelColor};">60s</div>
                                    <div class="font-mono text-3xl font-bold" style="color: ${pbValueColor};">${(pbTime["60"] && pbTime["60"].wpm) || "-"}</div>
                                    <div class="font-mono text-base mt-1" style="color: ${pbSubColor};">${(pbTime["60"] && pbTime["60"].acc) || "-"}${(pbTime["60"] && pbTime["60"].acc == "-") ? "" : "%"}</div>
                                </div>
                                <div class="flex flex-col items-center justify-center" style="width: 120px;">
                                    <div class="font-mono text-lg font-semibold mb-1" style="color: ${pbLabelColor};">120s</div>
                                    <div class="font-mono text-3xl font-bold" style="color: ${pbValueColor};">${(pbTime["120"] && pbTime["120"].wpm) || "-"}</div>
                                    <div class="font-mono text-base mt-1" style="color: ${pbSubColor};">${(pbTime["120"] && pbTime["120"].acc) || "-"}${(pbTime["120"] && pbTime["120"].acc == "-") ? "" : "%"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </foreignObject>
        </svg>
    `;
    return svg;
}

module.exports = {
    getOGSvg,
    getSvg,
};
