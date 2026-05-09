"use client";

import { ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Markdown from "react-markdown";
import SummaryPrompt from "../components/SummaryPrompt";

const content = `
## **Chapter 2** 

## **Linked Lists** 

Linked lists can be thought of from a high level perspective as being a series of nodes. Each node has at least a single pointer to the next node, and in the last node’s case a 
null pointer representing that there are no more nodes in the linked list. 

In DSA our implementations of linked lists always maintain head and tail pointers so that insertion at either the head or tail of the list is a constant time operation. Random i
nsertion is excluded from this and will be a linear operation. As such, linked lists in DSA have the following characteristics: 

1. Insertion is _O_ (1) 

2. Deletion is _O_ ( _n_ ) 

3. Searching is _O_ ( _n_ ) 

Out of the three operations the one that stands out is that of insertion. In DSA we chose to always maintain pointers (or more aptly references) to the node(s) at the head and t
ail of the linked list and so performing a traditional insertion to either the front or back of the linked list is an _O_ (1) operation. An exception to this rule is performing 
an insertion before a node that is neither the head nor tail in a singly linked list. When the node we are inserting before is somewhere in the middle of the linked list (known 
as random insertion) the complexity is _O_ ( _n_ ). In order to add before the designated node we need to traverse the linked list to find that node’s current predecessor. This 
traversal yields an _O_ ( _n_ ) run time. 

This data structure is trivial, but linked lists have a few key points which at times make them very attractive: 

1. the list is dynamically resized, thus it incurs no copy penalty like an array or vector would eventually incur; and 

2. insertion is _O_ (1). 

## **2.1 Singly Linked List** 

Singly linked lists are one of the most primitive data structures you will find in this book. Each node that makes up a singly linked list consists of a value, and a reference t
o the next node (if any) in the list. 

9 

_CHAPTER 2. LINKED LISTS_ 

10 

Figure 2.1: Singly linked list node 

![](data:image/png;base64,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)


Figure 2.2: A singly linked list populated with integers 

## **2.1.1 Insertion** 

In general when people talk about insertion with respect to linked lists of any form they implicitly refer to the adding of a node to the tail of the list. When you use an API l
ike that of DSA and you see a general purpose method that adds a node to the list, you can assume that you are adding the node to the tail of the list not the head. 

Adding a node to a singly linked list has only two cases: 

   1. _head_ = _∅_ in which case the node we are adding is now both the _head_ and _tail_ of the list; or 

   2. we simply need to append our node onto the end of the list updating the _tail_ reference appropriately. 

- 1) **algorithm** Add( _value_ ) 

- 2) **Pre:** _value_ is the value to add to the list 

- 3) **Post:** _value_ has been placed at the tail of the list 

- 4) _n ←_ node( _value_ ) 

- 5) **if** _head_ = _∅_ 

- 6) _head ← n_ 

- 7) _tail ← n_ 

- 8) **else** 

- 9) _tail_ .Next _← n_ 10) _tail ← n_ 

- 11) **end if** 

- 12) **end** Add 

As an example of the previous algorithm consider adding the following sequence of integers to the list: 1, 45, 60, and 12, the resulting list is that of Figure 2.2. 
`;

export default function LearnPage() {
  const [reachedBottom, setReachedBottom] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || reachedBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setReachedBottom(true);
    }
  }, [reachedBottom]);

  return (
    <div
      className="relative h-full overflow-auto"
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <article
        className={`prose max-w-3xl mx-auto p-8 mb-6 transition-all duration-300 ${blurred ? "blur-sm" : ""}`}
      >
        <Markdown urlTransform={(url) => url}>{content}</Markdown>
      </article>
      <SummaryPrompt visible={blurred} />
      <button
        onClick={() => setBlurred(!blurred)}
        className={`group fixed right-0 top-0 flex items-center justify-center w-20 h-full cursor-pointer transition-all duration-300 bg-gray-100/30 hover:bg-gray-200 hover:w-24 ${
          reachedBottom && !blurred
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10 pointer-events-none"
        }`}
      >
        <ChevronRight className="text-gray-400 transition-all duration-200 group-hover:text-gray-700 group-hover:translate-x-0.5 group-active:translate-x-1" />
      </button>
    </div>
  );
}
