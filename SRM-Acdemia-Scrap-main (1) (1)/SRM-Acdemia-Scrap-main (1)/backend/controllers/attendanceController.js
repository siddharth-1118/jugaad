const cheerio = require("cheerio");
const logger = require("../utils/logger");
const { unescapeHtmlString } = require("../utils/htmlUtils");
const { SRM_DOMAIN, createSrmApiClient } = require("../utils/srmApi");
const { getSessionTokenFromHeaders } = require("../utils/sessionUtils");

const SRM_ATTENDANCE_URL = `${SRM_DOMAIN}/srm_university/academia-academic-services/page/My_Attendance`;

function parseAttendanceDetails($) {
    const attendanceData = [];
    const attendanceTable = $("table[bgcolor='#FAFAD2']");

    if (attendanceTable.length === 0) return attendanceData;

    attendanceTable
        .find("tr")
        .slice(1)
        .each((_, row) => {
            const cells = $(row).find("td");
            if (cells.length >= 9) {
                const fullCourseCode = $(cells[0]).text().trim();
                const courseType = $(cells[0]).find("font").text().trim();
                const courseCode = fullCourseCode.split("\n")[0].trim();

                if (!courseCode) return;

                const courseTitle = $(cells[1]).text().trim();
                const category = $(cells[2]).text().trim();
                const facultyName = $(cells[3]).text().trim();
                const slot = $(cells[4]).text().trim();
                const roomNo = $(cells[5]).text().trim();
                const hoursConducted = parseInt($(cells[6]).text().trim(), 10) || 0;
                const hoursAbsent = parseInt($(cells[7]).text().trim(), 10) || 0;
                const attendancePercentage =
                    parseFloat(
                        $(cells[8]).find("font").text().trim() || $(cells[8]).text().trim()
                    ) || 0;
                const hoursPresent = hoursConducted - hoursAbsent;

                const courseMetrics = calculateAttendanceMetrics(
                    hoursPresent,
                    hoursConducted
                );

                attendanceData.push({
                    courseCode,
                    courseType: courseType || "Regular",
                    courseTitle,
                    category,
                    facultyName,
                    roomNo,
                    hoursConducted,
                    hoursPresent,
                    hoursAbsent,
                    attendancePercentage,
                    canSkip: courseMetrics.canSkip,
                    needToAttend: courseMetrics.needToAttend,
                    status: courseMetrics.status,
                });
            }
        });

    return attendanceData;
}

function calculateAttendanceMetrics(
    hoursPresent,
    hoursConducted,
    targetPercentage = 75
) {
    const currentPercentage =
        hoursConducted > 0
            ? parseFloat(((hoursPresent / hoursConducted) * 100).toFixed(2))
            : 0;

    let canSkip = 0;
    let needToAttend = 0;

    if (currentPercentage >= targetPercentage) {
        canSkip = Math.floor(
            (hoursPresent - (targetPercentage / 100) * hoursConducted) /
            (targetPercentage / 100)
        );
        canSkip = Math.max(0, canSkip);
    } else {
        const numerator = (targetPercentage / 100) * hoursConducted - hoursPresent;
        const denominator = 1 - targetPercentage / 100;
        needToAttend = denominator > 0 ? Math.ceil(numerator / denominator) : 0;
        needToAttend = Math.max(0, needToAttend);
    }

    return {
        currentPercentage,
        canSkip,
        needToAttend,
        status: currentPercentage >= targetPercentage ? "safe" : "critical",
    };
}

async function handleFetchAttendance(req, res) {
    const sessionToken = getSessionTokenFromHeaders(req);
    const apiClient = await createSrmApiClient(sessionToken);

    try {
        const srmAttendanceResponse = await apiClient.get(SRM_ATTENDANCE_URL, {
            headers: {
                Accept: "*/*",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Referer: SRM_DOMAIN + "/",
                "X-Requested-With": "XMLHttpRequest",
            },
        });

        const fullPageHtml = srmAttendanceResponse.data;
        const match = fullPageHtml.match(/pageSanitizer\.sanitize\('([\s\S]*)'\);/);

        if (!match || !match[1]) {
            logger.error("Failed to parse attendance response");
            return res.status(500).json({
                success: false,
                error: "Failed to parse attendance response",
            });
        }

        const unescapedHtml = unescapeHtmlString(match[1]);
        const $ = cheerio.load(unescapedHtml);

        const courses = parseAttendanceDetails($);

        res.status(200).json({
            success: true,
            data: { courses },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ err: error.message }, "Error fetching attendance");

        res.status(500).json({
            success: false,
            error: "Failed to fetch attendance",
        });
    }
}

module.exports = { handleFetchAttendance };
