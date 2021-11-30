const express = require("express"),
  app = express(),
  { request, gql } = require("graphql-request"),
  endpoint = "https://url-shortner.hasura.app/v1/graphql",
  headers = {
    "Hasura-Client-Name": "hasura-console",
    "content-type": "application/json",
    "x-hasura-admin-secret": process.env.KEY,
  },
  host = process.env.HOST || "localhost",
  port = process.env.PORT || 3000;

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const query = gql`
      query getUrl($id: String!) {
        url_by_pk(id: $id) {
          url
        }
      }
    `;

    const data = await request(endpoint, query, { id: slug }, headers);
    if (data.url_by_pk) {
      return res.send({ originUrl: data.url_by_pk.url });
    } else {
      return res.status(404).send("Invalid Request.");
    }
  } catch (err) {
    console.log(err);
    return res.status(404).send("Invalid Request.");
  }
});

app.post("/create", async (req, res) => {
  try {
    const { slug, url } = req.body;

    const query = gql`
      mutation createUrl($id: String!, $url: String!) {
        insert_url(objects: { id: $id, url: $url }) {
          returning {
            id
            url
          }
        }
      }
    `;

    const data = await request(
      endpoint,
      query,
      { id: slug, url: url },
      headers
    );
    console.log(JSON.stringify(data));

    return res.send({ shortUrl: host + "/" + data.insert_url.returning[0].id });
  } catch (err) {
    return res.status(400).send("Please provide a unique slug.");
  }
});

app.use((req, res) => {
  return res.send("404 Not found.");
});

app.use((error, req, res, next) => {
  if (error) {
    console.log(JSON.stringify(error));
    return res.send("Something went wrong.");
  }
});

app.listen(port, () => console.log(`Listening on ${host} : ${port}...`));
