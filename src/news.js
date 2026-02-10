const axios = require('axios');

async function getLatestNews() {
    try {
        const token = process.env.CRYPTOPANIC_API_KEY;
        if (!token) {
            console.error('CRYPTOPANIC_API_KEY is missing');
            return null;
        }
        const res = await axios.get(`https://cryptopanic.com/api/developer/v2/posts/?auth_token=${token}&public=true&kind=news`);
        const latest = res.data.results[0];
        if (!latest) return null;
        return {
            title: latest.title,
            url: latest.url,
            domain: latest.domain, panic_score: latest.panic_score || 0, votes: latest.votes || {}
        };
    } catch (error) {
        console.error('Error fetching news:', error.message);
        return null;
    }
}

module.exports = { getLatestNews };
