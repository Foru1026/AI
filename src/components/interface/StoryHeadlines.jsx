import { STORY_LINES } from "../../lib/timeline.js";

export default function StoryHeadlines({ chapter, nodes, glitchRef }) {
  return (
    <div className="story-headlines" data-story-chapter={chapter}>
      {STORY_LINES[chapter].map((text, i) => (
        <h2
          key={text}
          className="story-headline t-h1"
          data-story-beat={i}
          aria-hidden="true"
          ref={(el) => {
            nodes.current[chapter + ":" + i] = el;
            if (glitchRef) glitchRef.current = el;
          }}
        >
          <span className="story-headline__body">
            <span className="story-headline__text text-gradient-h1">{text}</span>
            {chapter === "redacted" && (
              <>
                <span className="story-headline__flare" aria-hidden="true" />
                <span className="story-headline__channel story-headline__channel--cyan" aria-hidden="true">
                  {text}
                </span>
                <span className="story-headline__channel story-headline__channel--blue" aria-hidden="true">
                  {text}
                </span>
              </>
            )}
          </span>
        </h2>
      ))}
    </div>
  );
}
