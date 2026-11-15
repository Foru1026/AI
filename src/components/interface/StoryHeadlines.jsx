import { STORY_KICKERS, STORY_LINES } from "../../lib/timeline.js";

export default function StoryHeadlines({ chapter, nodes }) {
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
          }}
        >
          <span className="story-headline__kicker t-label-mono">{STORY_KICKERS[chapter][i]}</span>
          <span className="story-headline__body">
            <span className="story-headline__text text-gradient-h1">{text}</span>
          </span>
        </h2>
      ))}
    </div>
  );
}
