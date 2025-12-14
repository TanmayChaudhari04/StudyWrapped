"use client";

import { useState, useEffect } from "react";
import { PDFUploader } from "@/components/pdf-uploader";
import { FlipCard } from "@/components/flip-card";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<string>("idle");
  const [result, setResult] = useState<any>(null);
  const [savedDecks, setSavedDecks] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [loadingDecks, setLoadingDecks] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load saved decks from Firebase
  useEffect(() => {
    async function loadDecks() {
      if (!user) return;

      setLoadingDecks(true);
      try {
        const q = query(
          collection(db, "decks"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const decks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort in JavaScript instead of Firestore to avoid index requirement
        decks.sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);
        setSavedDecks(decks);
      } catch (error) {
        console.error("Error loading decks:", error);
      } finally {
        setLoadingDecks(false);
      }
    }

    if (user) {
      loadDecks();
    }
  }, [user]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const handleUploadComplete = async (path: string) => {
    setStatus("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfPath: path, userId: user.uid }),
      });
      const data = await res.json();
      setResult(data);
      setStatus("complete");

      // Reload decks after generation
      const q = query(
        collection(db, "decks"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const decks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      decks.sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);
      setSavedDecks(decks);
    } catch (error) {
      console.error("Generation failed:", error);
      setStatus("error");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Are you sure you want to delete this deck?")) return;

    try {
      await deleteDoc(doc(db, "decks", deckId));
      // Reload decks
      const q = query(
        collection(db, "decks"),
        where("userId", "==", user!.uid)
      );
      const querySnapshot = await getDocs(q);
      const decks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      decks.sort((a: any, b: any) => b.createdAt.seconds - a.createdAt.seconds);
      setSavedDecks(decks);
      setSelectedDeck(null);
    } catch (error) {
      console.error("Error deleting deck:", error);
      alert("Failed to delete deck. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">StudyWrapped Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/wrapped")}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded font-medium text-sm transition"
            >
              View Your Wrapped 🎉
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Upload Section - Only show if not viewing a deck */}
        {!selectedDeck && status === "idle" && (
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Deck</h2>
            <PDFUploader onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Loading State */}
        {status === "generating" && (
          <div className="bg-white p-12 rounded-2xl shadow-xl w-full max-w-md mx-auto text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">Agents at Work</h3>
            <p className="text-gray-500">Reading PDF, generating syllabus, and creating cards...</p>
          </div>
        )}

        {/* Results View - Just generated */}
        {status === "complete" && result && !selectedDeck && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your New Deck ({result.flashcards?.length || 0} cards)</h2>
              <button
                onClick={() => { setStatus("idle"); setResult(null); }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition"
              >
                Return to Dashboard
              </button>
            </div>

            {/* Syllabus Chips */}
            <div className="flex flex-wrap gap-2">
              {result.syllabus?.map((topic: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {topic}
                </span>
              ))}
            </div>

            {/* Flashcards Grid with Flip Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.flashcards?.map((card: any, i: number) => (
                <FlipCard
                  key={i}
                  question={card.question}
                  answer={card.answer}
                  topic={card.topic}
                />
              ))}
            </div>
          </div>
        )}

        {/* Saved Decks List */}
        {!selectedDeck && status === "idle" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Saved Decks ({savedDecks.length})</h2>

            {loadingDecks ? (
              <p className="text-gray-500">Loading your decks...</p>
            ) : savedDecks.length === 0 ? (
              <div className="bg-white p-8 rounded-xl text-center text-gray-500">
                <p>No decks yet. Upload a PDF to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="text-xs text-gray-400 mb-2">
                      {new Date(deck.createdAt.seconds * 1000).toLocaleDateString()}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{deck.cardCount} Cards</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {deck.topics?.slice(0, 3).map((topic: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                      {deck.topics?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{deck.topics.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/study/${deck.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition"
                      >
                        Study Now
                      </button>
                      <button
                        onClick={() => setSelectedDeck(deck)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Deck View */}
        {selectedDeck && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Deck: {selectedDeck.cardCount} Cards</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteDeck(selectedDeck.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                >
                  Delete Deck
                </button>
                <button
                  onClick={() => setSelectedDeck(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition"
                >
                  Back to Decks
                </button>
              </div>
            </div>

            {/* Syllabus Chips */}
            <div className="flex flex-wrap gap-2">
              {selectedDeck.topics?.map((topic: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {topic}
                </span>
              ))}
            </div>

            {/* Flashcards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedDeck.cards?.map((card: any, i: number) => (
                <FlipCard
                  key={i}
                  question={card.question}
                  answer={card.answer}
                  topic={card.topic}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
