# Bots, Scrapers & Cookies (and Sausage/Pizza/Away)

## INTRO

So I was chilling at home, had some paid leave days and well.. I got tired from building my text editor but I also didn't feel like going out and I was thinking how funny it is that I, a grown man, am hooked on a social media (X/Twitter) so I got the funny idea to double-down on my addiction and try to build a browser extension that would allow me to scroll my X timeline wherever I am in a sidepanel.

I got to work, chatted with my favorite LLMs and I genuinely thought this would be a 5-minute craft. Alas.. it wasn't. All the practices I knew of did not work.
      
I tried iframes and webview which obviously did not work due to Content-Security-Policy frame-ancestors 'none' / X-Frame-Options: DENY.
Then I tried embeddings (suggested by Claude) and that was an awful attempt.

A few dozens of iterations.. still nothing. And then I got the idea.

I switched to o3, I opened my network tab, and I snatched every single network request, as well as my cookies, local storage, session storage, forage, and whatever I could find that had the keyword "x" or "twitter" :DD. That's when my interest hardened itself. Cookies. What the hell are cookies?!

## Cookies
  
So.. what the hell are cookies? Well, let's talk about the web first.

### How does the web work

What is the web? You open your laptop, your laptop boots, some magical things happen, your system starts systemming and you get to the good part. SCROLLING. ROTTING. INTELLECTUALIZING ON X DOT COM. But how does that work?

Let's look at the specific technologies responsible for the system that lets you, the user, interact with the website.

It works like this:

- Website

- Infrastructure it's hosted on
      
**The website:**

- **UI (stuff like Next.JS, React, HTML, CSS.. etc.)** There are maaaany different way to achieve UI, but in our current generation React is the go-to choice. The UI is responsible for the rendering and the visual part of the website. But don't be fooled. UI is as much visuality, 10x that the logic.. it's hard to program a good UI. The one thing that I find the hardest in UI is its state machine. It's literally a state machine, different states, all interacting with each other, the user typing viciously, clicking, changing pages, closing the tab, opening it again, opening a different tab.. making one quadrilioin requests a second. It's genuinely a lot to handle.

- **API / Backend (stuff like node.js, php, golang, fastapi, etc.)** The backend is again code that the developers write that serves as a base the UI connects to. The UI goes to the backend and says, "hey, I need this data", which is often _pulled_ from _somewhere_ and the backend gives the UI this data. It's most often in the form of JSON. And the _somewhere_? It's most often a database. A place where there is data. It could also be a file hehe.. but anyway, that's for the backend.

**The Infrastructure:**

- The infrastructure is the place where the UI and the API are stationed. It's a collection of services, all working together to provide a strong reliable system for the API and the UI to run on. The system could be virtual machine, it could be on premises, it could be a kubernetes cluster, and so on.. the system is just compute with interfaces to interact with this compute. Here, just like in the UI and API, there are hundreds of ways to configure an infrastructure platform.

Now. Since this is a dive into cookies and web, we won't be going into details on UI / API / Infra, but we will simulate an environment. Let's draw a mock environment and go from there.

Ok. We now have a vague understanding what a website is. We also have the same for how a website runs. But how does the connection happen? That's networking. 

### **OSI Model (Please Do Not Throw Sausage Pizza Away)**

![https://cf-assets.www.cloudflare.com/slt3lc6tev37/6ZH2Etm3LlFHTgmkjLmkxp/59ff240fb3ebdc7794ffaa6e1d69b7c2/osi_model_7_layers.png](https://cf-assets.www.cloudflare.com/slt3lc6tev37/6ZH2Etm3LlFHTgmkjLmkxp/59ff240fb3ebdc7794ffaa6e1d69b7c2/osi_model_7_layers.png)

I always get this funny feeling thinking about the PDNTSPA, but it's actually a pretty good way to remember it! But what is it exactly? Well, it's the following:

- P(lease): Physical
- D(o): Data Link
- N(ot): Network
- T(hrow): Transport
- S(ausage): Session
- P(izza): Presentation
- A(way): Application

The OSI model is the base of the base when it comes to networking. It's really just the internals of a package and the route it takes to reach a destination. It is bi-directional. It always goes from P to A and from A to P.

> TL;DR:
>
> You click a button -> Your computer initiates an HTTP request -> The HTTP request goes each layer down FROM Application TO Physical (Physical is your cable/wi-fi) then your Router takes on (Layer 3/Network) and sends the request through, your request hops through routers, they do some hops on the OSI model -> the end server receives the request, unpacks it from Layer 1 (physical), then sends it back and then more packages do all those things again and again and again.
>
>Here is also a wonderful explanation on what the OSI model is from cloudflare [https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/](https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/).

Now. Knowing what the OSI model is, it's time to focus on the more targeted layers. Application, Presentation, and Session. This is where authentication occurs, and more importantly, where cookies, identifiers, and telemetry happens.

## Authentication

When I started in tech I had a problem understanding the difference between Authentication and Authorization. We are focusing on Authentication. The difference is that Authentication AUTHENTICATES someone, while Authorization AUTHORIZES someone. So trivial...

But generally Authentication is that thing that allows the system recognize who you are. That's where sessions happen, that's the technology that allows you to have your own little space on every website like X, Youtube, etc.

In OSI model terms, authentication happens in the following layers:

- Application

- Presentation

- Session

> GPT is debating with me that the authentication happens **ONLY** in the Application layer but I refuse to believe this because it really seems to me that while yeah, most textbooks auths firmly sit into L7, I still think sloppy work at L6/L5 can break the process

But more importantly, for this exact use case, it mostly happens on Layer 7 (Application).

And here's how it works:

You get a session, which session works like a "filter" that's being applied to your requests. It encapsulates your request and puts them all in one session. The concept of a session is (in my opinion) very multi-dimensional because you could have a session without being authenticated to a website. The moment you enter a website, you get a session. Your clients starts a session with the end server. Crazy.. And then you also get a session when you authenticate, a different kind of session. Some sessions are stored in the database, some are stored in the browser, some are stored as TLS session tickets cached by a CDN ([a good explanation here](https://blog.lukaszolejnik.com/tls-session-tickets-and-data-protection-gdpr-eprivacy/)).

Then presentation happens. This is when TLS termination happens. This is basically wrapping the request in encryption.

And then the Application stage comes, which is where the cookie-specific logic and identity checks live. At this layer the web server finally looks inside the already‑decrypted HTTP request (from the Presentation layer), parses headers like `Cookie:` and `Authorization: Bearer …`, asks its user record storage (DB) if those look like a real account i.e. if they exist, enforces stuff like rate‑limits and additional checks, and chooses what to send back -- HTML, JSON, an error code, whatever. In short, every "decision" the backend takes happens here, based on the values the backend receives. The generated response is then packaged again and it goes back the same route it came to you, the end user.

### Types of authentication

Well.. strap on because this is going to be intense. At least it was for me. I always knew there are different types of authentication, but I also thought authentication is pretty much Bearer / JWT with the session tokens that are stored _somewhere_. Turns out.. that is not the case:

| Category                          | What proves you are you                     | Typical examples                                                                 | Notes / where you see it                                                                 |
|-----------------------------------|---------------------------------------------|---------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| **Knowledge‑based** ("something you know") | A secret string or answer                   | • Password / pass‑phrase<br>• PIN<br>• Security questions                       | Easiest to deploy, easiest to phish or reuse. Often combined with another factor.       |
| **Possession‑based** ("something you have") | A device or one‑time code only you possess  | • TOTP apps (Google Authenticator, Authy)<br>• Hardware OTP tokens (YubiKey, RSA SecurID)<br>• SMS codes<br>• Magic‑link e‑mails | Usable as a second factor or password‑less (FIDO2, passkeys). SMS is weakest—susceptible to SIM‑swap. |
| **Inherence‑based** ("something you are") | Biometric trait                             | • Fingerprint / Face ID<br>• Voice or iris scan                                 | Convenient, but needs fallback. In WebAuthn passkeys, the biometric unlocks a private key that lives in hardware. |
| **Location‑based** ("somewhere you are") | Network or GPS location                     | • Office IP range required for admin login<br>• Geo‑fencing for banking app     | Rarely stand‑alone; usually an extra policy check.                                      |
| **Behavioral / continuous**       | How you act                                 | • Keystroke dynamics<br>• Mouse‑movement pattern<br>• Touch‑screen gestures     | Runs in the background to re‑verify session, raise risk score or trigger step‑up auth.  |
| **Certificate‑based / cryptographic** | Proof you control a private key             | • Mutual‑TLS client certs<br>• SSH public‑key login<br>• FIDO2 / passkeys (asymmetric keys in secure element) | Server challenges the client to sign data; no shared secret to steal.                   |
| **Federated / delegated**         | A trusted third‑party vouches for you       | • OAuth 2 “Sign in with …”, OpenID Connect<br>• SAML assertions in enterprise SSO | Site never sees the user’s password; relies on the identity provider’s token.           |
| **API‑specific tokens**           | Long‑lived or scoped secrets for programs   | • Bearer tokens (GitHub PAT, Twitter web token)<br>• JSON Web Tokens (JWTs)<br>• HMAC‑signed requests (AWS SigV4)<br>• API keys in headers or query params | Designed for server‑to‑server or script access. Often combined with access‑control scopes and expiry. |
| **Adaptive / risk‑based**         | Mix of signals scored in real time          | • Google “Suspicious sign‑in” flow<br>• Banking app requiring OTP only on new device | No single factor; dynamically picks how many factors are needed based on risk.          |

Now.. if I had to dive deep in every single type that would probably take me days, if not weeks (plus the technical implementations to harden my knowledge) but let's look at the type of authentication that allowed me to hijack my session and manually CURL the API requests.

X uses session credentials stored in the `auth_token` cookie. This is the cookie responsible for the live session. It also uses a `bearer` token stored in the browser storage to handle the high-level checks (on X the bearer header is an OAuth 2 access token (for your user or a guest), while the auth_token cookie ties that token to the logged-in account). And it introduces a mandatory check which is the csrf (`ct0`) cookie that handles CSRF protection. Those live in the Application layer.

### "Exploiting" Authentication

In this current case, the technique used to allow us to get a response from the X API is called "session hijacking". It is the practice of HIJACKING (copying) an active session. To put it in bouncer terms, here is what it's all about:

> imagine there's a guy trying to enter yuor bar. The guy is over 18, you let him go in the bar, and then... 15 more guys looking EXACTLY the same way, wearing EXACTLY the same clothes, and having the EXACT SAME ID come to you and well.. you let those enter too. That's session hijacking.

So.. essentially, we are copying the `auth_token`, `bearer`, and `ct0 (csrf)` cookie, and we go to the backend and we say, "hi, this is me, I am real, give me the goods", and the API looks at our ID (our request) and it says, "sure!" and gives us the goods.

On my [x post](https://x.com/kuberdenis/status/1919838516894433534) some people complained this is not session hijacking and that made me giggle because CONCEPTUALLY it is still session hijacking. I assume those people only consider it a session hijacking if it's the session of someone else. But if we look at the OSI model, it is still, clearly, session hijacking, since the backend cannot make the difference between the X client and us, with our our tiny little CURL request.

### Where is this "exploit" used

As the title makes it clear, this is a commonly used practice in botting and scraping. This is of course used by hackers to achieve identity theft, and so on.

But most globally, bots and scrapers.

I just realized I am close to the end of this article but I mainly wrote about networking, authentication, and web development. No content about bots. But well, what I explored here is basically the inner workings of a bot working with a target's API. A lot of sites are working in this exact same way, and many sites do not have enough guardrails to handle bots.

To create a bot, one would only need to

- create an account manually
- automate the sntaching of the required tokens/cookies
- write some code to achieve what you want
- - simulate user actions
- - scrape data
- - farm engagement
- - etc.

Reading some, there are some very sophisticated bots that manage to pass the rate limits and checks, but that would require a lot of understanding and a lot of banned accounts on the platform one is trying to bot.

## Closing

That was little side quest. The topic is huge. It's so huge in fact it contains a huge number of domains (backend development, frontend development, system programming, networking, security, automation, and probably even more).

Creating a bot turns out to be easier than I imagined.

Creating a very good bot however.. a task that would require a lot of knowledge and time.

Nevertheless, I learned a lot and refreshed some of my knowledge that I haven't used in a long time. Man I really need to change jobs...

-- Dennis