import axios from 'axios';

export default {
  name: '.trs',
  description: 'Fetch torrents from various providers and return magnet links',
  usage: 'Type .trs <search-term> to find torrents',

  async execute(message, arguments_) {
    if (!arguments_.length) {
      return message.reply('No arguments given for search');
    }

    const query = arguments_.join(' ');
    const url = `https://torrent.exonoob.in/api/all/${encodeURIComponent(query)}/1`;
    let results = [];

    try {
      const { data } = await axios.get(url, { timeout: 10000 });

      if (Array.isArray(data[0])) {
        results.push(...data[0]);
      }

      if (Array.isArray(data[1])) {
        for (const movie of data[1]) {
          if (movie.Files && movie.Files.length > 0) {
            for (const file of movie.Files) {
              results.push({
                Name: movie.Name,
                Size: file.Size,
                DateUploaded: movie.ReleasedDate,
                Seeders: 'N/A',
                Leechers: 'N/A',
                Downloads: movie.Likes || 'N/A',
                Magnet: file.Magnet,
              });
            }
          }
        }
      }

      if (!results.length) {
        return message.reply(`No results found for *${query}*`);
      }

      let reply = `*Search results for ${query}*\n\n`;

      results.forEach(result => {
        reply += `*Name:* ${result.Name || 'N/A'}\n` +
                 `*Size:* ${result.Size || 'N/A'}\n` +
                 `*Upload Date:* ${result.DateUploaded || 'N/A'}\n` +
                 `*Seeders:* ${result.Seeders || 'N/A'}\n` +
                 `*Leechers:* ${result.Leechers || 'N/A'}\n` +
                 `*Downloads:* ${result.Downloads || 'N/A'}\n` +
                 `*Magnet Link:*\n${result.Magnet || 'N/A'}\n\n`;
      });

      await message.reply(reply.trim());
    } catch (err) {
      console.error('Error fetching torrents:', err.message);
      await message.reply('Something went wrong while fetching results.');
    }
  },
};
