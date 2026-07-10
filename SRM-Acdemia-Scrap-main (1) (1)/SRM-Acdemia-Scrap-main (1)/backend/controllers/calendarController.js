const { fetchElementText, processCalendarHtml, decodeHexSequences, resolveHtmlEntities } = require('../utils/htmlUtils');
const { createSrmApiClient, SRM_DOMAIN } = require('../utils/srmApi');
const { getSessionTokenFromHeaders } = require("../utils/sessionUtils");
const logger = require("../utils/logger");
const cheerio = require('cheerio');

const ACADEMIC_PLANNER_URL = `${SRM_DOMAIN}/srm_university/academia-academic-services/page/Academic_Planner_2025_26_ODD`;

async function fetchAcademicCalendarData(req, res) {
    const sessionToken = getSessionTokenFromHeaders(req);
    const apiClient = await createSrmApiClient(sessionToken);

    try {
        const response = await apiClient.get(ACADEMIC_PLANNER_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                Referer: SRM_DOMAIN + "/",
                Cookie: sessionToken,
            }
        });

        const rawHtmlResponse = response.data;
        let finalHtmlToParse = rawHtmlResponse;

        const sanitizeMatch = rawHtmlResponse.match(/pageSanitizer\.sanitize\(\s*'([\s\S]*)'\s*\);/);
        if (sanitizeMatch && sanitizeMatch[1]) {
            const intermediateHtml = decodeHexSequences(sanitizeMatch[1]);
            finalHtmlToParse = resolveHtmlEntities(intermediateHtml);
        } else {
            finalHtmlToParse = resolveHtmlEntities(rawHtmlResponse);
            const $rawParsed = cheerio.load(finalHtmlToParse);
            const extracted = $rawParsed('#zcPageContent').html() || $rawParsed('#elementsContainer').html() || $rawParsed('div.mainDiv').parent().html();
            if (extracted) finalHtmlToParse = extracted;
        }

        const $html = cheerio.load(finalHtmlToParse);

        const pageInfoSelectors = {
            pageTitle: "div.mainDiv > div.LogoDiv > h2[align='center']",
            collegeName: "div.mainDiv > div.LogoDiv > h3[align='center']",
            instituteName: "div.mainDiv > div.LogoDiv > p.small[align='center']"
        };
        const pageInfo = fetchElementText($html, pageInfoSelectors);

        const { calendar: monthlyEvents, legend: legendDetails, note: pageNote } = processCalendarHtml($html);

        if (!monthlyEvents || typeof monthlyEvents !== 'object' || Object.keys(monthlyEvents).length === 0) {
            if (!pageInfo.pageTitle && !pageInfo.collegeName) {
                logger.error('Failed to parse academic planner content');
                return res.status(502).json({ success: false, error: 'Failed to retrieve valid page content from SRM.' });
            }
        }

        res.json({
            success: true,
            data: {
                title: pageInfo.pageTitle || "",
                college: pageInfo.collegeName || "",
                institute: pageInfo.instituteName || "",
                note: pageNote || "",
                legend: legendDetails || {},
                events: monthlyEvents || {}
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error({ err: { message: error.message, stack: error.stack, responseStatus: error.response?.status } }, 'Error in fetchAcademicCalendarData');
        res.status(500).json({ success: false, error: 'Failed to fetch or process academic planner', details: error.message });
    }
}

module.exports = { fetchAcademicCalendarData };
