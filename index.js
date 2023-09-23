import express from "express";
import net from "net";
import dns from "dns";
const app = express();
const port = 3333;

app.get("/", (_, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Welcome on Mailtester API" });
});

const validateEmail = (email) => {
  const validSyntax = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
  if (!validSyntax) {
    return Promise.resolve(false);
  }

  const domain = email.split('@')[1];
  const ports = [25, 587, 465];
  
  return new Promise((resolve) => {
    const tryNextPort = (index) => {
      if (index >= ports.length) {
        resolve(false);
        return;
      }
      
      const port = ports[index];
      
      dns.resolveMx(domain, (err, mxRecords) => {
        if (err || !mxRecords || mxRecords.length === 0) {
          tryNextPort(index + 1);
        } else {
          const smtp = net.createConnection(port, mxRecords[0].exchange);
          let connected = false;
          const timeout = 3000; // 3 seconds
          const timeoutId = setTimeout(() => {
            if (!connected) {
              smtp.destroy();
              tryNextPort(index + 1);
            }
          }, timeout);
          smtp.on('connect', () => {
            connected = true;
            clearTimeout(timeoutId);
            smtp.destroy();
            resolve(true);
          });
          smtp.on('error', () => {
            tryNextPort(index + 1);
          });
        }
      });
    };
    
    tryNextPort(0);
  });
};

app.get("/single-mail/:email", async (req, res) => {
  const email = req.params.email;

  validateEmail(email)
  .then((response) => {
    if(response){
      return res
        .status(200)
        .json({
          success: true,
          message: `${email} is a valid email address.`
        });
    } else {
      return res
        .status(406)
        .json({
          success: false, 
          message: `${email} is NOT a valid email address.`
        });
    }
  })
  .catch((err) => {
    return res
      .status(406)
      .json({
        success: false,
        message: `${email} is NOT a valid email address.`,
        error: err
      });
  });
});


app.post("/bulk-mails", (req, res) => {
    const emails = req.body.emails;
    
    return res
    .status(418)
    .json({
      success: true,
      message: "Not implemented yet",
    });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});