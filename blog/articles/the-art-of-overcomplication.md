# The Art of Overcomplication: A Story of a Finished Failure

It always starts with an idea. You test that idea. You see it is not impossible and you form a pact with yourself:

> *"I am not going to do anything more than just this one little thing. I will see how people react to it and based on the results, I will decide if it's worth the time. Just this one little thing. Just the MVP."*

And you get to it. You start coding and you get through the POC phase, you prove to yourself that it works, and then you decide to focus on making your MVP.

While you focus on your MVP you find little flaws in your initial plan and start increasing the value (only in your head) of your MVP little by little by adding more features. You lie to yourself that those are just tiny upgrades and all of a sudden it hits you...

You lean back in your chair and take a look a good look at your screen.

**It seems you now have an All-OS-Native, multi-cluster, microservice-themed, redundant and highly available, cloud native SaaS platform...**

Your side project is now a monster. And you, dear reader, are Frankenstein.

## Why Side Projects Fail You

I think coding products / apps / games / etc. alone doesn't allow you to invest too much. It is very important, in my opinion, to build one quick POC, polish your MVP, then ship as fast as possible. After your launch, it is best to take a look at the statistics and if your customers are positive, that might be an indication to continue spending time and resources on that project. Otherwise - onto the next one!

However, it is often very hard to stay biased when you are overtaken by the euphoria and hype that rushes through you when you successfully implement a few features and prove to yourself you can do it. This is exactly what happened with me.

In the next few chapters, I will briefly explain what happened with my side project ([globchess.com](https://globchess.com)) and hopefully shed light on common traps that you might face with your side projects.

> ### Additional Resources
>
> More in-depth version of this article in the form of a story - [soon / not finished yet]()
> Excalidraw diagram of my architecture and notes - [link](https://link.excalidraw.com/readonly/nCtlhLBy5cA6rlQVRJnV?darkMode=true)
> Github repository with the code for the project - [link](https://github.com/kubeden/globchess-public)

## Bad Code & Its Consequences

I started to write the code for [Globchess](https://globchess.com) on a static index.html file with [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) to simply check if I am able to create a chessboard. Since it was simply a farfetched idea which I didn't believe I was capable of executing, I heavily relied on ChatGPT and found *chessboard.js* and *chess.js* - the two libraries which made the project possible.

### My First Mistake: No Modularity

I coded the skeleton for my web app inside my *index.html* and started coding in an *index.js* file. This was my first mistake. I quickly put 300 lines of code (most of which copied from ChatGPT) inside my single JavaScript file and did not think about breaking it down into modules or using a framework like React / Next that would make my life much easier in the future. Instead, I was blinded by the success of coding feature after feature and soon I had an unmanageable 300+ lines of code in a single file.

Notes:

- Good for POC but I should have archived that and started all over with planning in mind

### My Second Mistake: No Architecture

While I still had about 200-300 lines of code in my single JavaScript file, I could have stopped for a while, do a little research on what type of database I should use, weight my options for frameworks and quickly refactor my code so that it is readable, manageable, and clean. But I did not do that.

Instead, I asked ChatGPT to help me use Firebase Firestore and Firebase Authentication to code my auth and database logic. This turned my single *index.js* file into 500-600+ lines of code now. Horrific.

Not to mention "real-time database" would be a better solution for my needs. I could have also used socket.io.

Oh, and I think it is good that I mention now that I am quite proficient in Laravel and have done all my other projects with it. Why did I even decide to go with Node.JS this time?

Notes:

- No architecture in mind
- Blunt trial & errors are not good for your MVP phase (that's for the POC)
- Do your research and choose wisely
- If you are comfortable with a framework / library, why run from it?!

### My Third Mistake: No Security, No Backend Validation

On top of doing it all in a single JS file, I did not think about backend for a single second. I was seeing the features I want to see work and I continued building on the frontend. No backend validation, no security considerations, nothing at all. Not even good routing. I was serving static html files.

I didn't even thought it was possible for me to miss things like that but again - success makes you blind. And my blindfold was me succeeding to code features I thought I couldn't.

Notes:

- Think about security
- Think about validation
- Your feature "working" with frontend-only code doesn't mean that's enough

### Consequences Of My Mistakes

At some point I leaned back in my chair and realised I had a completely unmanageable, unreadable, and performance-low code in front of me that was already doomed.

Implementing features started becoming way too hard because I couldn't easily read my code. I tried to break it down into modules and once I nearly succeeded in that, I realised I don't have any backend validation and my webapp is full of security flaws that the worst hacker could exploit. My average load speed was about 20 seconds which I don't even want to comment on.

And at this moment, I gave up. I fixed a few bugs to make my project somewhat presentable and decided to call it a day.

And that's the story of my finished failure.

## Conclusion

Building products alone could be euphoric in the beginning but staying blind due to your hype sets you up for a path of failure. Be biased, plan the execution of your projects and know when to stop with adding new features. Stay true to your MVP and ship fast.

Keep to your metrics and continue doing what you like. I tried building an HR platform but I was not at all passionate about it so it took me 1 year to build it. [Globchess](https://globchess.com) took me about 10 days and it is way more heavy in terms of features.

If you read through the end, thank you for your time. I couldn't write about all the details along this project but I am working on a longer version of it. If you are interested, stay tuned.

My name is Dennis (kubeden) and I blog about DevOps, my side projects, and more.

If you feel like chatting, feel free to do so on [x.com/kubeden](https://x.com/kubeden).

C'ya!