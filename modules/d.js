const express = require("express");
const router = express.Router();
const fs = require("fs");

// Serve main page (d)
router.get("/", (req, res) => {
  res.render("d.html");
});

// Serve everything in d/ folder
fs.readdirSync("public/pages/d/").forEach(file => {
  router.get("/" + file.split(".")[0], (req, res) => {
    res.render("d/" + file);
  });
});

module.exports.router = router;

// Now when <directory /> is seen
module.exports.pi = () => {
  let links = fs.readFileSync("public/pages/d/links.json");
  links = JSON.parse(links);

  const urls = links.reduce((acc, link) => {
    acc.push(link.url)
    return acc;
  }, []);

  // Add new html files that aren't already in links 
  fs.readdirSync("public/pages/d/").forEach(file => {
    const [fileName, fileExtension] = file.split(".");
    const tr = { url: "/d/" + fileName };
    if (fileExtension === "html" && !urls.includes(tr.url)) {
      tr.file = file;
      links.push(tr);
    }
  });

  for (let link of links) {
    if ("file" in link) {
      const file = link.file;
      const [fileName, fileExtension] = file.split(".");
      const html = fs.readFileSync("public/pages/d/" + file, "utf8");

      // Title is taken from HTML <title> tag
      const tTL = { // titleTagLocation
        start: html.search("<title>") + 7,
        end: html.search("</title>")
      }
      link.title = html.substring(tTL.start, tTL.end);

      // Date is taken from <meta name="date"> if it exists
      const dML = html.search('<meta name="date"');  // dateMetaLocation
      const dateMetaExists = !(dML === -1);
      if (dateMetaExists) {
        link.date = html.substring(dML + 27, dML + 35);
      }

      // If no date saved yet then make it today
      if (!("date" in link)) {
        const today = new Date().toISOString();
        const yyyy = today.slice(0, 4);
        const mm = today.slice(5, 7); 
        const dd = today.slice(8, 10);
        link.date = yyyy + mm + dd;
      }
    }
  }

  // Sort links
  links.sort((a, b) => b.date - a.date);

  // Update links.json
  const data = JSON.stringify(links); 
  fs.writeFile("public/pages/d/links.json", data, "utf8", (err) => {
    if (err) throw err;
    console.log("links.json has been saved");
  });

  // Create dateText: from "20190602" to "6/ 2/19" etc.
  links.forEach(link => {
    const ld = link.date;
    const d = ld.slice(7 - (ld.charAt(6) !== "0"));
    let m = ld.slice(5 - (ld.charAt(4) !== "0"), 6);
    m = (" " + m).slice(-2);
    const y = ld.slice(2, 4);
    link.dateText = [d, m, y].join("/");
  });

  // Construct and return table
  return "<table>" + 
    links.reduce((acc, d) => {
        return acc + `
          <tr${d.hidden ? ' class="hidden"' : ""}>
            <td>${d.dateText}</td>
            <td><a href="${d.url}">${d.title}</a></td>
          </tr>` }, "") + `
    </table>`;
}