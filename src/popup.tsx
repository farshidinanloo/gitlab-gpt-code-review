import { useState } from 'react';

export function Popup() {
  const [project, setProject] = useState('');
  const [mr, setMr] = useState('');
  const [output, setOutput] = useState<string | null>(null);

  const review = () => {
    chrome.runtime.sendMessage(
      { type: 'review-mr', payload: { projectId: project, mrIid: mr } },
      (res) => {
        setOutput(res.suggestions);
      }
    );
  };

  return (
    <div className="p-4 w-80">
      <h1 className="font-bold">GPT Code Review</h1>
      <input
        placeholder="Project ID"
        className="w-full p-1 border mt-2"
        value={project}
        onChange={e => setProject(e.target.value)}
      />
      <input
        placeholder="MR IID"
        className="w-full p-1 border mt-2"
        value={mr}
        onChange={e => setMr(e.target.value)}
      />
      <button className="mt-3 px-3 py-1 bg-green-600 text-white rounded" onClick={review}>
        Review
      </button>
      {output && (
        <pre className="mt-3 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap">
          {output}
        </pre>
      )}
    </div>
  );
}

