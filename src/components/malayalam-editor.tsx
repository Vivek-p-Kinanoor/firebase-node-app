
'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LanguageCode } from '@/ai/flows/detect-article-language';

interface MalayalamEditorProps {
  language: LanguageCode;
  isTransliterationEnabled: boolean;
  onContentChange: (hasContent: boolean) => void;
  placeholder: string;
  className?: string;
  onEnterPress?: () => void;
}

export interface MalayalamEditorRef {
  clear: () => void;
  setContent: (content: string) => void;
  getDOMNode: () => HTMLDivElement | null;
}

const MalayalamEditor = forwardRef<MalayalamEditorRef, MalayalamEditorProps>(
  ({ language, isTransliterationEnabled, onContentChange, placeholder, className, onEnterPress }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const suggestionBoxRef = useRef<HTMLDivElement>(null);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggestionBoxVisible, setIsSuggestionBoxVisible] = useState(false);
    const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState<number | null>(null);
    const suggestionButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (editorRef.current) {
          editorRef.current.innerText = '';
          onContentChange(false);
        }
      },
      setContent: (content: string) => {
        if (editorRef.current) {
          editorRef.current.innerText = content;
          placeCaretAtEnd(editorRef.current);
          onContentChange(!!content.trim());
        }
      },
      getDOMNode: () => editorRef.current,
    }));
    
    useEffect(() => {
        if (highlightedSuggestionIndex !== null && suggestionButtonRefs.current[highlightedSuggestionIndex]) {
          suggestionButtonRefs.current[highlightedSuggestionIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
    }, [highlightedSuggestionIndex]);

    const placeCaretAtEnd = (el: HTMLElement) => {
        el.focus();
        if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
        }
    };
    
    const chooseSuggestion = (selectedText: string, addLineBreak: boolean = false) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
    
        // 1. Get the current word being typed to determine its length
        const range = selection.getRangeAt(0).cloneRange();
        range.selectNodeContents(editor);
        range.setEnd(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset);
        const textBeforeCursor = range.toString();
        const words = textBeforeCursor.split(/[\s\n]+/);
        const currentWord = words[words.length - 1] || '';
    
        if (!currentWord) return;
    
        // 2. Use selection.modify to select the word backwards. This is robust across DOM nodes.
        for (let i = 0; i < currentWord.length; i++) {
            selection.modify('extend', 'backward', 'character');
        }
    
        const replacementText = selectedText + (addLineBreak ? '\n' : ' ');
    
        // 3. Replace the selected (now highlighted) word
        const rangeToReplace = selection.getRangeAt(0);
        rangeToReplace.deleteContents();
        const textNode = document.createTextNode(replacementText);
        rangeToReplace.insertNode(textNode);
        
        // 4. Move the caret to the end of the inserted node
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(textNode);
        newRange.collapse(true);
        selection.addRange(newRange);
    
        onContentChange(!!editor.innerText.trim());
        setIsSuggestionBoxVisible(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        chooseSuggestion(suggestion.replace(/^\d+\.\s*/, ""));
    };
    
    const updateSuggestionBoxPosition = () => {
        if (!editorRef.current || !suggestionBoxRef.current) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();

        suggestionBoxRef.current.style.left = `${rect.left - editorRect.left}px`;
        suggestionBoxRef.current.style.top = `${rect.bottom - editorRect.top + 5}px`;
    }

    const fetchSuggestions = async (word: string) => {
        const languageApiMap: Record<string, string> = {
            malayalam: 'ml-t-i0-und',
            tamil: 'ta-t-i0-und',
            kannada: 'kn-t-i0-und',
            hindi: 'hi-t-i0-und',
        };

        const apiCode = languageApiMap[language];
        if (!apiCode) {
            setIsSuggestionBoxVisible(false);
            return;
        }

        try {
            const response = await fetch(
              `https://www.google.com/inputtools/request?text=${encodeURIComponent(word)}&itc=${apiCode}&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=jsapi`
            );
            const data = await response.json();
            
            // **CRITICAL FIX**: Check if the response is successful AND if it contains a valid suggestion array.
            const suggestionsArray = data?.[1]?.[0]?.[1];
            if (data[0] === "SUCCESS" && Array.isArray(suggestionsArray) && suggestionsArray.length > 0) {
              setSuggestions([...suggestionsArray, word]);
              setHighlightedSuggestionIndex(null); 
              suggestionButtonRefs.current = [];
              setIsSuggestionBoxVisible(true);
              updateSuggestionBoxPosition();
            } else {
              setIsSuggestionBoxVisible(false);
            }
          } catch (error) {
            console.error("Transliteration error:", error);
            setIsSuggestionBoxVisible(false);
          }
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const editor = e.currentTarget;
        onContentChange(!!editor.innerText.trim());

        if (!isTransliterationEnabled) {
            setIsSuggestionBoxVisible(false);
            return;
        }
        const isTransliterationSupported = ['malayalam', 'tamil', 'kannada', 'hindi'].includes(language);
        if (!isTransliterationSupported) {
            setIsSuggestionBoxVisible(false);
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        // Create a range from the start of the editor to the current caret position
        const range = selection.getRangeAt(0).cloneRange();
        range.selectNodeContents(editor);
        range.setEnd(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset);
        const textBeforeCursor = range.toString();
        
        const words = textBeforeCursor.split(/[\s\n]+/);
        const currentWord = words[words.length - 1] || '';

        if (currentWord && /^[a-zA-Z0-9]+$/.test(currentWord)) {
            fetchSuggestions(currentWord);
        } else {
            setIsSuggestionBoxVisible(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isSuggestionBoxVisible && suggestions.length > 0) {
        const items = suggestions;
    
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setHighlightedSuggestionIndex(prev =>
              prev === null ? 0 : (prev + 1) % items.length
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setHighlightedSuggestionIndex(prev =>
              prev === null
                ? items.length - 1
                : (prev - 1 + items.length) % items.length
            );
            break;
          case 'Enter': {
            e.preventDefault();
            if (suggestions.length > 0) {
                const indexToChoose = highlightedSuggestionIndex !== null ? highlightedSuggestionIndex : 0;
                const selectedSuggestion = suggestions[indexToChoose].replace(/^\d+\.\s*/, "");
                chooseSuggestion(selectedSuggestion, true);
            }
            if (onEnterPress) {
              onEnterPress();
            }
            break;
          }
          case ' ':
            if (suggestions.length > 0) {
              e.preventDefault();
              const indexToChoose = highlightedSuggestionIndex !== null ? highlightedSuggestionIndex : 0;
              chooseSuggestion(suggestions[indexToChoose].replace(/^\d+\.\s*/, ""));
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsSuggestionBoxVisible(false);
            break;
          default:
            if (e.key >= '1' && e.key <= '9') {
              const index = parseInt(e.key, 10) - 1;
              if (items[index]) {
                e.preventDefault();
                chooseSuggestion(items[index].replace(/^\d+\.\s*/, ""));
              }
            }
            break;
        }
      } else if (e.key === 'Enter' && onEnterPress && !e.shiftKey) {
          e.preventDefault();
          onEnterPress();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const selection = window.getSelection();
        if (!selection) return;

        // In some browsers, a paste into an empty contentEditable div doesn't create a range.
        // We ensure a range exists.
        if (selection.rangeCount === 0) {
            selection.addRange(document.createRange());
        }
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move caret to the end of the inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // After pasting, the content has changed. Notify the parent.
        onContentChange(!!e.currentTarget.innerText.trim());
    };

    const getLanguageFontClass = (lang: LanguageCode | undefined | null): string => {
        switch (lang) {
            case 'malayalam': return 'font-anek-malayalam';
            case 'kannada': return 'font-noto-kannada';
            case 'tamil': return 'font-noto-tamil';
            case 'hindi': return 'font-noto-devanagari';
            default: return '';
        }
    };

    return (
        <div className="relative">
          <div
              ref={editorRef}
              id="editor"
              contentEditable={true}
              spellCheck="false"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              suppressContentEditableWarning={true}
              className={cn(
                  "input-focus-glow relative min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 whitespace-pre-wrap overflow-auto custom-scrollbar",
                  "empty:before:content-[attr(placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
                  getLanguageFontClass(language),
                  className
              )}
              placeholder={placeholder}
          />
          {isSuggestionBoxVisible && suggestions.length > 0 && (
              <div 
                  ref={suggestionBoxRef}
                  className="absolute z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md"
              >
                  <ScrollArea className="max-h-48">
                      <div className="p-2 space-y-1">
                          {suggestions.map((suggestion, index) => (
                              <Button
                                  key={`${suggestion}-${index}`}
                                  variant="ghost"
                                  size="sm"
                                  glow="none"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className={cn(
                                      'w-full justify-start',
                                      'hover:bg-primary/80 hover:text-primary-foreground',
                                      getLanguageFontClass(language),
                                      highlightedSuggestionIndex === index ? 'bg-primary text-primary-foreground' : ''
                                  )}
                                  ref={el => { if (el) suggestionButtonRefs.current[index] = el; }}
                              >
                                  <span className="text-xs text-muted-foreground mr-2 w-4 text-center">{index + 1}</span>
                                  {suggestion}
                              </Button>
                          ))}
                      </div>
                  </ScrollArea>
              </div>
          )}
        </div>
    );
  }
);
MalayalamEditor.displayName = 'MalayalamEditor';

export default React.memo(MalayalamEditor);
