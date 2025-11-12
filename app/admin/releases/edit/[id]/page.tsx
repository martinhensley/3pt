"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";
import AdminHeader from "@/components/AdminHeader";

interface CardInfo {
  id?: string;
  playerName: string;
  team?: string;
  cardNumber: string;
  variant?: string;
  setName?: string;
  serialNumber?: string;
  printRun?: number;
}

interface SetInfo {
  id?: string;
  name: string;
  isBaseSet: boolean;
  type?: 'Base' | 'Autograph' | 'Memorabilia' | 'Insert'; // Set type
  totalCards?: string;
  printRun?: number | null; // Print run for parallel sets (e.g., 44 for "/44")
  parallels?: string[];
  cards?: CardInfo[];
  isNew?: boolean;
  isDeleted?: boolean;
  manualSerialMode?: boolean;
  selectedParallel?: string; // Which parallel the user is currently adding cards for
  parentSetId?: string | null; // Reference to parent set
  parallelSets?: SetInfo[]; // Child parallel sets (for parent sets)
}

interface SourceFile {
  url: string;
  filename: string;
  type: string;
}

interface SourceDocument {
  id: string;
  filename: string;
  displayName: string;
  blobUrl: string;
  mimeType: string;
  fileSize: number;
  documentType: 'SELL_SHEET' | 'CHECKLIST' | 'PRESS_RELEASE' | 'PRICE_GUIDE' | 'IMAGE' | 'OTHER';
  description: string | null;
  uploadedAt: string;
}

interface ReleaseSourceDocument {
  id: string;
  document: SourceDocument;
  usageContext: string | null;
  linkedAt: string;
}

interface Release {
  id: string;
  name: string;
  year: string;
  releaseDate: string | null;
  postDate: string | null;
  description: string | null;
  sourceFiles: SourceFile[] | null;
  sourceDocuments?: ReleaseSourceDocument[];
  isApproved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  manufacturerId: string;
  manufacturer: {
    id: string;
    name: string;
  };
  sets: Array<{
    id: string;
    name: string;
    isBaseSet: boolean;
    totalCards: string | null;
    parallels: string[] | null;
    parentSetId: string | null;
    cards: Array<{
      id: string;
      playerName: string | null;
      team: string | null;
      cardNumber: string | null;
      variant: string | null;
      parallelType: string | null;
      serialNumber: string | null;
    }>;
    parallelSets?: Array<{
      id: string;
      name: string;
      isBaseSet: boolean;
      totalCards: string | null;
      printRun: number | null;
      parentSetId: string | null;
    }>;
  }>;
  images?: Array<{
    id: string;
    url: string;
    caption: string | null;
  }>;
}

export default function EditReleasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const releaseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchingRelease, setFetchingRelease] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [descriptionFile, setDescriptionFile] = useState<File | null>(null);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Release data
  const [release, setRelease] = useState<Release | null>(null);

  // Editable release fields
  const [editedManufacturer, setEditedManufacturer] = useState("");
  const [editedReleaseName, setEditedReleaseName] = useState("");
  const [editedYear, setEditedYear] = useState("");
  const [editedReleaseDate, setEditedReleaseDate] = useState("");
  const [editedPostDate, setEditedPostDate] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedSets, setEditedSets] = useState<SetInfo[]>([]);
  const [collapsedSets, setCollapsedSets] = useState<Set<number>>(new Set()); // Track which sets are collapsed

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch release data function (moved outside useEffect so it can be called from other functions)
  const fetchRelease = async () => {
    if (!releaseId) return;

    try {
      setFetchingRelease(true);
      const response = await fetch(`/api/releases?id=${releaseId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch release");
      }

      const data: Release = await response.json();
      setRelease(data);

      // Populate editable fields
      setEditedManufacturer(data.manufacturer.name);
      setEditedReleaseName(data.name);
      setEditedYear(data.year);
      setEditedReleaseDate(data.releaseDate || "");
      setEditedPostDate(data.postDate ? new Date(data.postDate).toISOString().split('T')[0] : "");
      setEditedDescription(data.description || "");
      setSourceFiles(data.sourceFiles as SourceFile[] || []);

      // Transform sets data - only show parent sets at top level
      // Child parallel sets are nested under their parent's parallelSets array
      const transformedSets: SetInfo[] = data.sets
        .filter((set: any) => set.parentSetId === null) // Only parent sets at top level
        .map((set: any) => ({
          id: set.id,
          name: set.name,
          isBaseSet: set.isBaseSet,
          type: set.type || 'Base',
          totalCards: set.totalCards || "",
          parallels: set.parallels || [],
          parentSetId: null,
          cards: set.cards.map((card: any) => ({
            id: card.id,
            playerName: card.playerName || "",
            team: card.team || "",
            cardNumber: card.cardNumber || "",
            variant: card.variant || "",
          })),
          parallelSets: set.parallelSets?.map((parallel: any) => ({
            id: parallel.id,
            name: parallel.name,
            isBaseSet: parallel.isBaseSet,
            type: parallel.type || 'Base',
            totalCards: parallel.totalCards || "",
            printRun: parallel.printRun,
            parallels: [],
            parentSetId: parallel.parentSetId,
            cards: [], // Parallel sets inherit parent's cards
            isNew: false,
            isDeleted: false,
          })) || [],
          isNew: false,
          isDeleted: false,
        }));

      setEditedSets(transformedSets);
    } catch (error) {
      console.error("Failed to fetch release:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to fetch release"
      });
    } finally {
      setFetchingRelease(false);
    }
  };

  // Fetch release data on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchRelease();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseId, status]);

  // Set management functions
  const handleAddSet = (isBaseSet: boolean = false) => {
    const newSet: SetInfo = {
      name: "",
      isBaseSet,
      totalCards: "",
      parallels: [],
      cards: [],
      isNew: true,
      isDeleted: false,
    };
    // Add new set at the beginning (top) instead of end
    setEditedSets([newSet, ...editedSets]);
  };

  const toggleSetCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedSets);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedSets(newCollapsed);
  };

  const handleUpdateSet = (index: number, field: keyof SetInfo, value: string) => {
    const updatedSets = [...editedSets];
    if (field === "name" || field === "totalCards" || field === "type") {
      updatedSets[index] = { ...updatedSets[index], [field]: value };
      setEditedSets(updatedSets);
    }
  };


  const handleRemoveSet = async (index: number) => {
    const setToRemove = editedSets[index];

    // If it's a new set (not yet saved), just remove from array
    if (setToRemove.isNew) {
      const updatedSets = editedSets.filter((_, i) => i !== index);
      setEditedSets(updatedSets);
      return;
    }

    // For existing sets, confirm deletion
    if (!confirm(`Are you sure you want to delete the set "${setToRemove.name}"? This will also delete all associated cards.`)) {
      return;
    }

    try {
      setLoading(true);

      // Call DELETE API
      const response = await fetch(`/api/sets?id=${setToRemove.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete set");
      }

      // Remove from local state
      const updatedSets = editedSets.filter((_, i) => i !== index);
      setEditedSets(updatedSets);

      setMessage({ type: "success", text: `Set "${setToRemove.name}" deleted successfully` });
    } catch (error) {
      console.error("Failed to delete set:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete set"
      });
    } finally {
      setLoading(false);
    }
  };

  const parseChecklistText = (text: string, setName: string): CardInfo[] => {
    const cards: CardInfo[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Check if first line is a header (contains common header keywords)
    let startIndex = 0;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('card_number') || firstLine.includes('player') ||
          firstLine.includes('subject') || firstLine.includes('number') ||
          firstLine.includes('name')) {
        startIndex = 1; // Skip header row
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let cardNumber = '';
      let playerName = '';
      let team = '';

      // Try CSV format first: "1,Player Name,Team /145" or "1,Player Name,Team"
      if (line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          cardNumber = parts[0];
          playerName = parts[1];
          team = parts[2] || '';

          // Extract print run from team if present (e.g., "Real Madrid /145")
          let printRun: number | undefined;
          const printRunMatch = team.match(/(.+?)\s*\/\s*(\d+)$/);
          if (printRunMatch) {
            team = printRunMatch[1].trim();
            printRun = parseInt(printRunMatch[2], 10);
          }

          if (cardNumber && playerName) {
            cards.push({
              cardNumber,
              playerName,
              team: team || undefined,
              printRun,
              setName: setName,
            });
            continue;
          }
        }
      }

      // Try space-separated format: "1 Player Name, Team /145" or "1. Player Name, Team"
      const match = line.match(/^(\d+)\.?\s+([^,]+)(?:,\s*(.+))?/);
      if (match) {
        const [, num, name, tm] = match;
        let teamName = tm?.trim();
        let printRun: number | undefined;

        // Extract print run from team if present
        if (teamName) {
          const printRunMatch = teamName.match(/(.+?)\s*\/\s*(\d+)$/);
          if (printRunMatch) {
            teamName = printRunMatch[1].trim();
            printRun = parseInt(printRunMatch[2], 10);
          }
        }

        cards.push({
          cardNumber: num.trim(),
          playerName: name.trim(),
          team: teamName,
          printRun,
          setName: setName,
        });
      }
    }

    return cards;
  };

  // Parser for cards with individual serial numbers: "Card#, Player, Team, /serial"
  const parseCardsWithSerialNumbers = (text: string, setName: string): CardInfo[] => {
    const cards: CardInfo[] = [];
    const lines = text.split('\n');

    let startIndex = 0;

    // Skip header lines: parallel name and "X cards" line
    if (lines.length > 0) {
      // Check first line - if it doesn't start with a card number, skip it
      const firstLine = lines[0].trim();
      if (firstLine && !/^\d+[,.\s]/.test(firstLine)) {
        startIndex = 1; // Skip first line if it's not a card
      }
    }

    // Check second line for "X cards" pattern
    if (startIndex < lines.length) {
      const secondLine = lines[startIndex].trim();
      if (/^\d+\s+cards?$/i.test(secondLine)) {
        startIndex++; // Skip "X cards" line
      }
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Match format: "2 Giovani Lo Celso, Argentina /149" or "2, Giovani Lo Celso, Argentina, /149"
      // Also handle: "25 Joan Martinez, Real Madrid (NO BASE)"
      const match = line.match(/^(\d+)[,.\s]+([^,]+?)(?:,\s*([^,/]+?))?(?:\s*\/(\d+))?\s*(?:\(.*?\))?$/);

      if (match) {
        const [, cardNum, player, team, serial] = match;
        const cardNumber = cardNum.trim();
        const playerName = player.trim();
        const teamName = team?.trim() || '';
        const serialNumber = serial ? `/${serial}` : undefined;
        const printRun = serial ? parseInt(serial, 10) : undefined;

        cards.push({
          cardNumber,
          playerName,
          team: teamName || undefined,
          setName: setName,
          serialNumber: serialNumber,
          printRun: printRun,
        });
      }
    }

    return cards;
  };

  // Unified parser for complete set format: sub-set name, card count, parallels, and card list
  const parseCompleteSetData = (text: string): {
    name: string;
    totalCards: string;
    standardParallels: string[];
    variableParallels: Array<{ name: string; maxPrintRun: string }>;
    cards: CardInfo[]
  } | null => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length === 0) return null;

    // First line is the sub-set name
    const name = lines[0];

    // Second line might be "X cards" - skip it, we'll count actual cards
    let currentIndex = 1;

    if (currentIndex < lines.length) {
      const cardsMatch = lines[currentIndex].match(/^(\d+)\s+cards?$/i);
      if (cardsMatch) {
        currentIndex++; // Skip the "X cards" line
      }
    }

    // Look for "Parallels" section
    const parallelsText: string[] = [];
    let inParallelsSection = false;
    let cardsSectionStart = currentIndex;

    for (let i = currentIndex; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line marks the start of parallels section
      if (line.toLowerCase() === 'parallels') {
        inParallelsSection = true;
        continue;
      }

      // Check if this is the start of the cards section
      // Cards start with: "2 Giovani Lo Celso, Argentina" (number followed by space and name with comma)
      const cardMatch = line.match(/^(\d+)\.?\s+([A-Z][\w\s]+),/);
      if (cardMatch && inParallelsSection) {
        // This looks like a card (has player name with comma after card number)
        cardsSectionStart = i;
        break;
      }

      // If in parallels section, add lines as parallels
      if (inParallelsSection && line) {
        parallelsText.push(line);
      }
    }

    // Parse parallels to separate standard from variable
    const { standardParallels, variableParallels } = parseParallelsText(parallelsText.join('\n'));

    // Parse cards from cardsSectionStart onwards
    const cardsText = lines.slice(cardsSectionStart).join('\n');

    // If there are variable parallels, the checklist will have serial numbers
    // Use the serial number parser to capture them for the base set
    const cards = variableParallels.length > 0
      ? parseCardsWithSerialNumbers(cardsText, name)
      : parseChecklistText(cardsText, name);

    // totalCards is the actual count of cards parsed from the checklist
    const totalCards = String(cards.length);

    return {
      name,
      totalCards,
      standardParallels,
      variableParallels,
      cards
    };
  };

  const handleChecklistUpload = async (index: number, file: File) => {
    try {
      setLoading(true);
      let text = "";

      // Handle PDF files differently
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setMessage({ type: "error", text: "PDF parsing for checklists is not yet implemented. Please use TXT or CSV files, or paste the text directly." });
        return;
      }

      // Read TXT and CSV files
      text = await file.text();

      const setName = editedSets[index].name || `Set ${index + 1}`;
      const cards = parseChecklistText(text, setName);

      if (cards.length === 0) {
        setMessage({ type: "error", text: "No cards found in the file. Please check the format (e.g., '1 Player Name, Team')" });
        return;
      }

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        cards: cards,
        totalCards: String(cards.length),
      };
      setEditedSets(updatedSets);

      setMessage({ type: "success", text: `Successfully added ${cards.length} cards to ${setName}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to parse checklist file:", error);
      setMessage({ type: "error", text: "Failed to parse checklist file. Please check the format." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Refresh card count for a specific set without reloading the entire page
  const refreshSetCardCount = async (setId: string) => {
    try {
      const response = await fetch(`/api/sets?id=${setId}`);
      if (!response.ok) return;

      const setData = await response.json();

      // Update just this set in the editedSets array
      setEditedSets(prevSets =>
        prevSets.map(set =>
          set.id === setId
            ? { ...set, totalCards: String(setData._count?.cards || 0) }
            : set
        )
      );
    } catch (error) {
      console.error('Failed to refresh set card count:', error);
    }
  };

  const createCardsInDatabase = async (setId: string, cards: CardInfo[], parallels: string[], manualSerialMode: boolean = false) => {
    try {
      const response = await fetch('/api/sets/create-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId,
          cards,
          parallels,
          manualSerialMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create cards');
      }

      if (manualSerialMode) {
        setMessage({
          type: 'success',
          text: `Created ${data.created} cards with individual serial numbers (${data.skipped} skipped as duplicates)`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Created ${data.created} cards across ${data.parallelsProcessed} parallels (${data.skipped} skipped as duplicates)`,
        });
      }
      setTimeout(() => setMessage(null), 5000);

      // Refresh just the card count for this set (don't reload entire page)
      await refreshSetCardCount(setId);
    } catch (error) {
      console.error('Failed to create cards in database:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create cards in database',
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleChecklistPaste = async (index: number, text: string) => {
    try {
      const currentSet = editedSets[index];
      const setName = currentSet.name || `Set ${index + 1}`;
      const manualSerialMode = currentSet.manualSerialMode || false;
      const selectedParallel = currentSet.selectedParallel;

      // If a parallel is selected, user is adding cards for a specific parallel
      if (selectedParallel && currentSet.parallels && currentSet.parallels.length > 0) {
        if (!currentSet.id) {
          setMessage({ type: "error", text: "Please save the set first before adding parallel cards" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        // Parse cards with serial numbers
        const cards = parseCardsWithSerialNumbers(text, setName);

        if (cards.length === 0) {
          setMessage({ type: "error", text: "No cards found. Format: 'Card# Player, Team /serial' (e.g., '2 Giovani Lo Celso, Argentina /149')" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        setMessage({ type: "success", text: `Creating ${cards.length} cards for parallel "${selectedParallel}"...` });

        // Create cards in database for the selected parallel
        await createCardsInDatabase(currentSet.id, cards, [selectedParallel], true);

        setMessage({ type: "success", text: `Successfully added ${cards.length} cards for parallel "${selectedParallel}"` });
        setTimeout(() => setMessage(null), 3000);

        return;
      }

      // If in manual serial mode, use the serial number parser
      if (manualSerialMode) {
        const cards = parseCardsWithSerialNumbers(text, setName);

        if (cards.length === 0) {
          setMessage({ type: "error", text: "No cards found. Format: 'Card# Player, Team /serial' (e.g., '2 Giovani Lo Celso, Argentina /149')" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        const updatedSets = [...editedSets];
        updatedSets[index] = {
          ...updatedSets[index],
          cards: cards,
          totalCards: String(cards.length),
        };
        setEditedSets(updatedSets);

        setMessage({ type: "success", text: `Successfully added ${cards.length} cards with serial numbers to ${setName}. Creating cards in database...` });

        // Create cards in database if set has an ID (use empty parallels array for manual serial mode)
        if (updatedSets[index].id) {
          await createCardsInDatabase(updatedSets[index].id!, cards, [], true);
        }

        return;
      }

      // Check if this is a base or variable parallel checklist update
      // Format: "Set Name\n25 cards\n2 Giovani Lo Celso, Argentina /149\n..."
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      const firstLine = lines[0];
      const secondLine = lines[1];

      // Check if first line matches the set name (base checklist update)
      const isBaseChecklist = firstLine && currentSet.name &&
        firstLine.toLowerCase() === currentSet.name.toLowerCase() &&
        secondLine && /^\d+\s+cards?$/i.test(secondLine);

      if (isBaseChecklist) {
        // This is a base checklist update! Update existing base cards
        const cards = parseCardsWithSerialNumbers(text, currentSet.name);

        if (cards.length === 0) {
          setMessage({ type: "error", text: "No cards found in base checklist" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        if (!currentSet.id) {
          setMessage({ type: "error", text: "Please save the set first" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        setMessage({ type: "success", text: `Updating ${cards.length} base cards...` });

        // Update base cards via API
        try {
          const response = await fetch('/api/sets/update-base-serials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              setId: currentSet.id,
              cards: cards,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to update base cards');
          }

          setMessage({ type: "success", text: `✓ Updated ${data.updated} base cards` });
          setTimeout(() => setMessage(null), 3000);

          // Refresh card count
          await refreshSetCardCount(currentSet.id);
        } catch (error) {
          console.error('Failed to update base cards:', error);
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'Failed to update base cards',
          });
          setTimeout(() => setMessage(null), 5000);
        }

        return;
      }

      // Check if first line matches a known parallel from this set (variable parallel update)
      const matchedParallel = currentSet.parallels?.find(p =>
        firstLine && p.toLowerCase().includes(firstLine.toLowerCase())
      );

      if (matchedParallel && secondLine && /^\d+\s+cards?$/i.test(secondLine)) {
        // This is a variable parallel checklist! Update existing cards
        const cards = parseCardsWithSerialNumbers(text, setName);

        if (cards.length === 0) {
          setMessage({ type: "error", text: "No cards found in parallel checklist" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        if (!currentSet.id) {
          setMessage({ type: "error", text: "Please save the set first" });
          setTimeout(() => setMessage(null), 5000);
          return;
        }

        setMessage({ type: "success", text: `Updating ${cards.length} cards for parallel "${matchedParallel}"...` });

        // Update cards via API
        try {
          const response = await fetch('/api/sets/update-parallel-serials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              setId: currentSet.id,
              parallelType: matchedParallel,
              cards: cards,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to update cards');
          }

          setMessage({ type: "success", text: `✓ Updated ${data.updated} cards for "${matchedParallel}"` });
          setTimeout(() => setMessage(null), 3000);

          // Refresh card count
          await refreshSetCardCount(currentSet.id);
        } catch (error) {
          console.error('Failed to update parallel cards:', error);
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'Failed to update parallel cards',
          });
          setTimeout(() => setMessage(null), 5000);
        }

        return;
      }

      // Standard mode: try parsing as complete set data (with name, parallels, cards)
      const completeData = parseCompleteSetData(text);

      if (completeData && completeData.cards.length > 0) {
        // Complete format detected - update name, parallels, cards, and totalCards (auto-counted from checklist)
        const updatedSets = [...editedSets];

        // Combine all parallels (standard + variable) for storage
        // DO NOT prepend set name - parallel names should be clean (e.g., "Electric Etch Red Pulsar /44")
        const rawParallels = [
          ...completeData.standardParallels,
          ...completeData.variableParallels.map(p => `${p.name} /${p.maxPrintRun} or fewer`)
        ];

        // Normalize /1 to "1 of 1" and sort by print run
        const normalizedParallels = rawParallels.map(normalizeParallelName);
        const allParallels = sortParallelsByPrintRun(normalizedParallels);

        console.log('🔍 Combined parallels for storage:', allParallels);
        console.log('🔍 About to save set with parallels:', allParallels);

        updatedSets[index] = {
          ...updatedSets[index],
          name: completeData.name,
          totalCards: String(completeData.cards.length), // Always use actual count
          parallels: allParallels.length > 0 ? allParallels : updatedSets[index].parallels,
          cards: completeData.cards,
        };

        // Variable parallels are stored within the base set, not as separate sets
        // They will be displayed as parallel badges on the set page

        // Now update state with all changes at once
        setEditedSets(updatedSets);

        const details = [];
        details.push(`${completeData.cards.length} cards`);
        if (completeData.standardParallels.length > 0) {
          details.push(`${completeData.standardParallels.length} standard parallels`);
        }
        if (completeData.variableParallels.length > 0) {
          details.push(`${completeData.variableParallels.length} variable parallels`);
        }

        setMessage({ type: "success", text: `Successfully loaded "${completeData.name}" with ${details.join(', ')}. Saving to database...` });

        // If this is a new set, save it first to get an ID
        if (updatedSets[index].isNew && !updatedSets[index].id) {
          try {
            console.log('📤 Sending to API - parallels:', allParallels);
            const response = await fetch('/api/sets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: completeData.name,
                isBaseSet: updatedSets[index].isBaseSet,
                type: updatedSets[index].type || (updatedSets[index].isBaseSet ? 'Base' : 'Insert'),
                totalCards: completeData.totalCards,
                parallels: allParallels, // Use combined parallels (standard + variable)
                releaseId: release!.id,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to create set');
            }

            const newSet = await response.json();
            console.log('📥 Received from API - newSet:', newSet);
            console.log('📥 newSet.parallels:', newSet.parallels);
            updatedSets[index] = {
              ...updatedSets[index],
              id: newSet.id,
              isNew: false,
            };

            // Update state with saved set ID
            setEditedSets(updatedSets);
          } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save set to database' });
            console.error('Error saving set:', error);
            return;
          }
        }

        // Create cards in database now that we have a set ID
        // If there are variable parallels, the base set also uses manual serial mode
        const useManualSerialMode = completeData.variableParallels.length > 0;
        if (updatedSets[index].id) {
          await createCardsInDatabase(
            updatedSets[index].id!,
            completeData.cards,
            completeData.standardParallels,
            useManualSerialMode
          );

          // Create child parallel sets for standard parallels (those without "or fewer")
          // Standard parallels inherit the parent's checklist automatically
          if (completeData.standardParallels.length > 0) {
            setMessage({ type: "success", text: `Creating ${completeData.standardParallels.length} parallel sets that inherit checklist...` });

            for (const parallelName of completeData.standardParallels) {
              try {
                // Extract print run from parallel name (e.g., "Electric Etch Red Pulsar /44" → 44)
                const printRunMatch = parallelName.match(/\/(\d+)(?:\s|$)/);
                const printRun = printRunMatch ? parseInt(printRunMatch[1], 10) : null;

                const response = await fetch('/api/sets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: `${completeData.name} ${parallelName}`,
                    type: updatedSets[index].type || (updatedSets[index].isBaseSet ? 'Base' : 'Insert'),
                    totalCards: completeData.totalCards,
                    printRun: printRun, // Store the print run number
                    releaseId: release!.id,
                    parentSetId: updatedSets[index].id, // Link to parent set for checklist inheritance
                    parallels: null, // Parallel sets don't have sub-parallels
                  }),
                });

                if (!response.ok) {
                  console.error(`Failed to create parallel set: ${parallelName}`);
                }
              } catch (error) {
                console.error(`Error creating parallel set ${parallelName}:`, error);
              }
            }

            setMessage({
              type: "success",
              text: `✓ Created parent set with ${completeData.cards.length} cards and ${completeData.standardParallels.length} parallel sets that inherit the checklist`
            });
            setTimeout(() => setMessage(null), 5000);
          }

          // Create stub sets for variable parallels (those with "or fewer")
          // These need their own explicit checklist
          if (completeData.variableParallels.length > 0) {
            createVariableParallelSets(
              index,
              completeData.name,
              completeData.variableParallels
            );
          }
        }

        return;
      }

      // Fall back to simple checklist parsing (just cards)
      const cards = parseChecklistText(text, setName);

      if (cards.length === 0) {
        setMessage({ type: "error", text: "No cards found in the pasted text. Please check the format (e.g., '1 Player Name, Team')" });
        setTimeout(() => setMessage(null), 5000);
        return;
      }

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        cards: cards,
        totalCards: String(cards.length),
      };
      setEditedSets(updatedSets);

      setMessage({ type: "success", text: `Successfully added ${cards.length} cards to ${setName}. Creating cards in database...` });

      // Create cards in database if set has an ID (i.e., it's been saved)
      if (updatedSets[index].id) {
        await createCardsInDatabase(updatedSets[index].id!, cards, updatedSets[index].parallels || [], false);
      }
    } catch (error) {
      console.error("Failed to parse pasted checklist:", error);
      setMessage({ type: "error", text: "Failed to parse pasted text. Please check the format." });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleClearChecklist = (index: number) => {
    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      cards: [],
    };
    setEditedSets(updatedSets);
  };

  // Parse parallels from text (one per line)
  // Returns object with standardParallels (for uniform print runs) and variableParallels (for "or fewer")
  const parseParallelsText = (text: string): { standardParallels: string[]; variableParallels: Array<{ name: string; maxPrintRun: string }> } => {
    const standardParallels: string[] = [];
    const variableParallels: Array<{ name: string; maxPrintRun: string }> = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const cleaned = line.trim();
      if (!cleaned) continue;

      // Check if this parallel has variable print runs ("or fewer (See list below)")
      const variableMatch = cleaned.match(/^(.+?)\s+\/(\d+)\s+or fewer\s*\(See list below\)/i);

      if (variableMatch) {
        const [, parallelName, maxPrintRun] = variableMatch;
        variableParallels.push({
          name: parallelName.trim(),
          maxPrintRun: maxPrintRun.trim(),
        });
      } else {
        // Standard parallel with uniform print run
        standardParallels.push(cleaned);
      }
    }

    return { standardParallels, variableParallels };
  };

  // Sort parallels by print run (non-numbered first, then descending by number, "1 of 1" last)
  const sortParallelsByPrintRun = (parallels: string[]): string[] => {
    return [...parallels].sort((a, b) => {
      // Check if parallel is "1 of 1"
      const isOneOfOne = (parallel: string): boolean => {
        return parallel.toLowerCase().includes('1 of 1');
      };

      // Extract print run numbers from parallel names
      const getNumber = (parallel: string): number | null => {
        // Match /1, /10, /99, etc.
        const match = parallel.match(/\/(\d+)(?:\s|$)/);
        return match ? parseInt(match[1], 10) : null;
      };

      const aIsOneOfOne = isOneOfOne(a);
      const bIsOneOfOne = isOneOfOne(b);

      // "1 of 1" always comes last
      if (aIsOneOfOne && bIsOneOfOne) return 0;
      if (aIsOneOfOne) return 1;
      if (bIsOneOfOne) return -1;

      const numA = getNumber(a);
      const numB = getNumber(b);

      // Non-numbered parallels come first
      if (numA === null && numB === null) return 0;
      if (numA === null) return -1;
      if (numB === null) return 1;

      // Sort by number descending (larger numbers first)
      // So /99 comes before /10, which comes before /5
      return numB - numA;
    });
  };

  // Normalize parallel names: convert /1 to "1 of 1"
  const normalizeParallelName = (parallel: string): string => {
    // Replace /1 at the end or before "or fewer" with "1 of 1"
    return parallel.replace(/\/1(?=\s+or fewer|$)/g, '1 of 1');
  };

  // Auto-create stub sets for variable parallels
  const createVariableParallelSets = (baseSetIndex: number, baseSetName: string, variableParallels: Array<{ name: string; maxPrintRun: string }>) => {
    const updatedSets = [...editedSets];
    const baseSet = updatedSets[baseSetIndex];

    // Create a new stub set for each variable parallel
    const newSets: SetInfo[] = variableParallels.map(parallel => ({
      name: `${baseSetName} ${parallel.name}`,
      isBaseSet: baseSet.isBaseSet,
      totalCards: baseSet.totalCards,
      parallels: [],
      cards: [],
      isNew: true,
      manualSerialMode: true, // Auto-enable manual serial mode for variable parallels
    }));

    // Insert the new sets right after the base set
    updatedSets.splice(baseSetIndex + 1, 0, ...newSets);
    setEditedSets(updatedSets);

    setMessage({
      type: 'success',
      text: `Created ${newSets.length} parallel sets. Paste checklist for each set with serial numbers.`,
    });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleParallelsUpload = async (index: number, file: File) => {
    try {
      const text = await file.text();
      const { standardParallels, variableParallels } = parseParallelsText(text);

      const updatedSets = [...editedSets];
      updatedSets[index] = {
        ...updatedSets[index],
        parallels: standardParallels,
      };
      setEditedSets(updatedSets);

      // If there are variable parallels, create stub sets for them
      if (variableParallels.length > 0) {
        const baseSetName = updatedSets[index].name;
        createVariableParallelSets(index, baseSetName, variableParallels);
      }
    } catch (error) {
      console.error("Failed to parse parallels file:", error);
      alert("Failed to parse parallels file. Please check the format.");
    }
  };

  const handleClearParallels = (index: number) => {
    const updatedSets = [...editedSets];
    updatedSets[index] = {
      ...updatedSets[index],
      parallels: [],
    };
    setEditedSets(updatedSets);
  };

  const handleGenerateDescription = async () => {
    // Check if we have source files first
    if (sourceFiles.length === 0 && !descriptionFile) {
      setMessage({ type: "error", text: "Please upload source files first or select a file to upload" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setGeneratingDescription(true);
      setMessage({ type: "success", text: "Generating description from source documents..." });

      // If a new file is selected, upload it first
      if (descriptionFile) {
        const formData = new FormData();
        formData.append("file", descriptionFile);
        formData.append("releaseId", release!.id);

        const uploadResponse = await fetch("/api/uploads/release-files", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const fileData = await uploadResponse.json();
          setSourceFiles([...sourceFiles, fileData]);
          setDescriptionFile(null); // Clear the file input
        }
      }

      // Generate description using AI with release info
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: release!.id,
          manufacturer: editedManufacturer,
          releaseName: editedReleaseName,
          year: editedYear,
          sets: release?.sets || []
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      setEditedDescription(data.excerpt || '');
      setMessage({ type: "success", text: "Description generated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to generate description:', error);
      setMessage({ type: "error", text: "Failed to generate description. Please try again." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!release) return;

    try {
      setUploadingFile(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("releaseId", release.id);

      const response = await fetch("/api/uploads/release-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const fileData = await response.json();

      // Add to sourceFiles array
      setSourceFiles([...sourceFiles, fileData]);

      setMessage({ type: "success", text: `File "${file.name}" uploaded successfully` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to upload file:", error);
      setMessage({ type: "error", text: "Failed to upload file. Please try again." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/uploads/release-files?url=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Remove from sourceFiles array
      setSourceFiles(sourceFiles.filter(f => f.url !== fileUrl));

      setMessage({ type: "success", text: "File deleted successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to delete file:", error);
      setMessage({ type: "error", text: "Failed to delete file. Please try again." });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!release || !e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);

    try {
      setUploadingImages(true);
      setMessage(null);

      // Upload each file to blob storage
      const urls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const { url } = await uploadResponse.json();
        urls.push(url);
      }

      // Save image records to database
      const saveResponse = await fetch(`/api/releases/${release.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: urls }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save images to release');
      }

      const { images } = await saveResponse.json();

      // Update local release state with new images
      setRelease({
        ...release,
        images: [...(release.images || []), ...images],
      });

      setMessage({
        type: "success",
        text: `Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`
      });
      setTimeout(() => setMessage(null), 3000);

      // Reset file input
      e.target.value = "";
    } catch (error) {
      console.error('Failed to upload images:', error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to upload images. Please try again."
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!release) return;

    try {
      setLoading(true);
      setMessage(null);

      const errors: string[] = [];

      // Update release metadata (name, year, description)
      try {
        const updateReleaseResponse = await fetch("/api/releases", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: release.id,
            name: editedReleaseName,
            year: editedYear,
            releaseDate: editedReleaseDate || null,
            postDate: editedPostDate || null,
            description: editedDescription || null,
            sourceFiles: sourceFiles.length > 0 ? sourceFiles : null,
          }),
        });

        if (!updateReleaseResponse.ok) {
          throw new Error("Failed to update release metadata");
        }
      } catch (error) {
        console.error("Error updating release:", error);
        errors.push(error instanceof Error ? error.message : "Failed to update release metadata");
      }

      // Process each set
      for (const set of editedSets) {
        if (set.isDeleted) continue; // Skip deleted sets

        // Skip sets with empty names (not yet filled out)
        if (!set.name || set.name.trim() === '') continue;

        try {
          if (set.isNew) {
            // Create new set
            const createResponse = await fetch("/api/sets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: set.name,
                type: set.type || 'Base',
                totalCards: set.totalCards || null,
                releaseId: release.id,
                parallels: set.parallels || [],
              }),
            });

            if (!createResponse.ok) {
              throw new Error(`Failed to create set "${set.name}"`);
            }

            await createResponse.json();

            // Add cards to the new set if any
            if (set.cards && set.cards.length > 0) {
              const cardsResponse = await fetch("/api/analyze/release", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  files: [],
                  createDatabaseRecords: true,
                  analysisData: {
                    manufacturer: editedManufacturer,
                    releaseName: editedReleaseName,
                    year: editedYear,
                    sets: [{
                      name: set.name,
                      totalCards: set.totalCards,
                      features: set.parallels || [],
                      cards: set.cards.map(card => ({
                        playerName: card.playerName,
                        team: card.team || undefined,
                        cardNumber: card.cardNumber,
                        variant: card.variant || undefined,
                      })),
                    }],
                  },
                }),
              });

              if (!cardsResponse.ok) {
                console.warn(`Failed to add cards to set "${set.name}"`);
              }
            }
          } else {
            // Update existing set
            const updateResponse = await fetch("/api/sets", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: set.id,
                name: set.name,
                type: set.type || 'Base',
                totalCards: set.totalCards || null,
                parallels: set.parallels || [],
              }),
            });

            if (!updateResponse.ok) {
              throw new Error(`Failed to update set "${set.name}"`);
            }

            // If cards were modified, delete existing cards and add new ones
            if (set.cards && set.cards.length > 0) {
              // Delete existing cards from the set
              await fetch(`/api/cards?setId=${set.id}`, {
                method: "DELETE",
              });

              // Add new cards to the set
              const cardsResponse = await fetch("/api/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  setId: set.id,
                  cards: set.cards.map(card => ({
                    playerName: card.playerName,
                    team: card.team || undefined,
                    cardNumber: card.cardNumber,
                    variant: card.variant || undefined,
                  })),
                }),
              });

              if (!cardsResponse.ok) {
                console.warn(`Failed to add cards to set "${set.name}"`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing set:`, error);
          errors.push(error instanceof Error ? error.message : `Failed to process set "${set.name}"`);
        }
      }

      if (errors.length > 0) {
        setMessage({
          type: "error",
          text: `Some errors occurred: ${errors.join("; ")}`
        });
      } else {
        setMessage({
          type: "success",
          text: "Release updated successfully!"
        });

        // Refresh the release data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save changes"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      router.push("/admin");
    }
  };

  if (status === "loading" || fetchingRelease) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (!release) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-orange-50 text-orange-800 p-4 rounded-lg">
            Release not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout maxWidth="4xl">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Releases", href: "/admin/releases" },
              { label: "Edit Release", href: `/admin/releases/edit/${releaseId}` },
            ]}
          />
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-orange-50 text-orange-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Release Information */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Release Information
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-gray-900 mb-1">
                Manufacturer:
              </label>
              <input
                type="text"
                value={editedManufacturer}
                onChange={(e) => setEditedManufacturer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Panini, Topps, Upper Deck"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Year:
                </label>
                <input
                  type="text"
                  value={editedYear}
                  onChange={(e) => setEditedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2024 or 2024-25"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Release Name:
                </label>
                <input
                  type="text"
                  value={editedReleaseName}
                  onChange={(e) => setEditedReleaseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Donruss Soccer, Select, Prizm"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Release Date:
                </label>
                <input
                  type="text"
                  value={editedReleaseDate}
                  onChange={(e) => setEditedReleaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., May 4, 2025 or Spring 2025 or 1978"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Can be specific (May 4, 2025) or vague (Spring 2025, 1978)
                </p>
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-1">
                  Post Date (for chronological ordering):
                </label>
                <input
                  type="date"
                  value={editedPostDate}
                  onChange={(e) => setEditedPostDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Auto-populated from Release Date, can be manually adjusted for backdating
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-green-300">
              <p className="text-gray-800">
                <span className="font-semibold">Full Release:</span> {editedYear} {editedReleaseName}
              </p>
            </div>
            <p className="text-gray-800">
              <span className="font-semibold">Sets:</span> {editedSets.filter(s => !s.isDeleted).length}
            </p>
            <p>
              <span className="font-semibold">Total Cards:</span>{" "}
              {editedSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Release Content Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Release Content
          </h3>

          <div className="space-y-4">
            {/* Release Title */}
            <div>
              <label className="block font-semibold text-gray-900 mb-1">
                Release Title:
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Formatted title displayed in posts (e.g., &quot;2024-25 Panini Obsidian Soccer&quot;)
              </p>
              <input
                type="text"
                value={`${editedYear} ${editedManufacturer} ${editedReleaseName}`.trim()}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            {/* GenAI Description Generator */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-footy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                GenAI: Generate Description from Source Files
              </h4>
              {sourceFiles.length > 0 ? (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Uses uploaded source files ({sourceFiles.length} file{sourceFiles.length !== 1 ? 's' : ''}) to generate description
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                    className="px-4 py-2 bg-gradient-to-r from-footy-green to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingDescription ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Description
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Upload source files below first, or optionally add a new file here
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                            e.target.value = "";
                          }
                        }}
                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                        disabled={uploadingFile}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generatingDescription || sourceFiles.length === 0}
                      className="px-4 py-2 bg-gradient-to-r from-footy-green to-green-600 hover:from-green-700 hover:to-green-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingDescription ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Description
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Manual Description Input */}
            <div>
              <label className="block font-semibold text-gray-900 mb-2">
                Description:
              </label>
              <textarea
                value={editedDescription.replace(/<[^>]*>/g, '')} // Strip HTML tags
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="A brief summary of this release for collectors..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Source Files Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Source Files
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload sell sheets, checklists, PDFs, or other documents used for reference when creating content
          </p>

          <div className="space-y-4">
            {/* Upload Section */}
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                      e.target.value = ""; // Reset input
                    }
                  }}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                  disabled={uploadingFile}
                />
              </label>
              {uploadingFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              )}
            </div>

            {/* File List */}
            {sourceFiles.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {sourceFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {file.type === "pdf" ? (
                          <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        ) : file.type.match(/^(png|jpg|jpeg|webp)$/) ? (
                          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* File Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                        <p className="text-xs text-gray-500 uppercase">{file.type}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-medium"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.url)}
                        className="px-3 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors font-medium"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sourceFiles.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No files uploaded yet</p>
              </div>
            )}

            {/* Source Documents (from SourceDocument table) */}
            {release?.sourceDocuments && release.sourceDocuments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documents from Document Library
                </h4>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 bg-gradient-to-br from-green-50 to-orange-50">
                  {release.sourceDocuments.map((releaseDoc) => {
                    const doc = releaseDoc.document;
                    const fileSizeMB = (doc.fileSize / (1024 * 1024)).toFixed(2);
                    const fileExtension = doc.filename.split('.').pop()?.toUpperCase() || 'FILE';

                    // Document type badge colors
                    const typeColors: Record<string, { bg: string; text: string }> = {
                      SELL_SHEET: { bg: 'bg-blue-100', text: 'text-blue-800' },
                      CHECKLIST: { bg: 'bg-green-100', text: 'text-green-800' },
                      PRESS_RELEASE: { bg: 'bg-purple-100', text: 'text-purple-800' },
                      PRICE_GUIDE: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
                      IMAGE: { bg: 'bg-pink-100', text: 'text-pink-800' },
                      OTHER: { bg: 'bg-gray-100', text: 'text-gray-800' },
                    };
                    const colors = typeColors[doc.documentType] || typeColors.OTHER;

                    return (
                      <div key={releaseDoc.id} className="flex items-center justify-between p-3 hover:bg-green-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-footy-green to-green-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {fileExtension}
                            </div>
                          </div>

                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.displayName}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {doc.documentType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-gray-500">{fileSizeMB} MB</span>
                              {releaseDoc.usageContext && (
                                <span className="text-xs text-gray-500 italic truncate">• {releaseDoc.usageContext}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={doc.blobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors font-medium"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/admin/library/source-documents/${doc.id}`, {
                                  method: 'DELETE',
                                });
                                if (!response.ok) {
                                  throw new Error('Failed to delete document');
                                }
                                setMessage({ type: 'success', text: 'Document deleted successfully' });
                                setTimeout(() => setMessage(null), 3000);
                                // Refresh release data
                                fetchRelease();
                              } catch (error) {
                                console.error('Failed to delete document:', error);
                                setMessage({ type: 'error', text: 'Failed to delete document' });
                                setTimeout(() => setMessage(null), 3000);
                              }
                            }}
                            className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  These documents are managed in the Document Library and linked to this release. Deleting a document will remove it from the Document Library and all releases.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Release Images Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Release Images
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload images to display in the release&apos;s image carousel (JPG, PNG, WebP)
          </p>

          <div className="space-y-4">
            {/* Upload Section */}
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  multiple
                  onChange={handleImageFilesChange}
                  disabled={uploadingImages}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              {uploadingImages && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              )}
            </div>

            {/* Display existing images */}
            {release && release.images && release.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {release.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.caption || "Release image"}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    {image.caption && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{image.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No images uploaded yet</p>
                <p className="text-xs text-gray-400 mt-1">Images will be displayed in the release&apos;s image carousel</p>
              </div>
            )}
          </div>
        </div>

        {/* Sets Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sets
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Base sets, parallels, inserts, autographs, and memorabilia cards
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddSet(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Set
            </button>
          </div>

          {editedSets.filter(set => !set.isDeleted).length > 0 ? (
            <div className="space-y-4">
              {editedSets
                .map((set, idx) => ({ set, originalIdx: idx }))
                .filter(({ set }) => !set.isDeleted)
                .map(({ set, originalIdx: idx }) => {
                  const isCollapsed = collapsedSets.has(idx);
                  return (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => toggleSetCollapse(idx)}
                            className="px-2 py-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title={isCollapsed ? "Expand" : "Collapse"}
                          >
                            <svg className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={set.name}
                              onChange={(e) => handleUpdateSet(idx, "name", e.target.value)}
                              placeholder="Set Name (e.g., Base, Optic, Dual Jersey Ink, Color Blast)"
                              className="w-full px-3 py-2 font-semibold border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                              value={set.type || 'Base'}
                              onChange={(e) => handleUpdateSet(idx, "type", e.target.value as 'Base' | 'Autograph' | 'Memorabilia' | 'Insert')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Base">Base</option>
                              <option value="Insert">Insert</option>
                              <option value="Autograph">Autograph</option>
                              <option value="Memorabilia">Memorabilia</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(idx)}
                            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex-shrink-0"
                            title="Remove set"
                            disabled={loading}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                    {!isCollapsed && (
                      <div>

                    {/* Show indicator if this is a variable parallel set (manual serial mode) */}
                    {set.manualSerialMode && (
                      <div className="border-t border-gray-300 pt-3 mt-3 bg-green-50 rounded-lg p-3 -mx-1">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-green-900">
                              Variable Serial Number Mode
                            </div>
                            <div className="text-xs text-green-700 mt-1">
                              This parallel set has unique serial numbers per card. Paste checklist with format: &ldquo;Card# Player, Team /serial&rdquo;
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unified Checklist/Set Data Upload/Paste Section */}
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Set Data (Checklist & Parallels):
                      </p>

                      {/* Show parallels with expandable sections for card management */}
                      {/* Only show legacy parallels array if parallelSets don't exist */}
                      {set.parallels && set.parallels.length > 0 && (!set.parallelSets || set.parallelSets.length === 0) ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 italic mb-3">
                            Click a parallel to add/view cards for that specific parallel.
                          </p>
                          {sortParallelsByPrintRun(set.parallels).map((parallel, pIdx) => {
                            // Check if this parallel has "or fewer" indicating variable serial numbers
                            const hasVariableSerials = parallel.toLowerCase().includes('or fewer');

                            // Get card count for this parallel from release data
                            const parallelCards = release?.sets
                              ?.find(s => s.id === set.id)
                              ?.cards?.filter(c => c.parallelType === parallel) || [];
                            const cardCount = parallelCards.length;

                            return (
                              <details key={pIdx} className="border border-gray-300 rounded-lg bg-gray-50">
                                <summary className="cursor-pointer p-3 hover:bg-gray-100 transition-colors">
                                  <div className="flex items-center gap-2 select-none">
                                    <span className="text-xs font-bold text-footy-green bg-white px-2 py-1 rounded border border-footy-green">
                                      {pIdx + 1}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 flex-grow">
                                      {parallel}
                                    </span>
                                    {hasVariableSerials && (
                                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                                        Variable Serials
                                      </span>
                                    )}
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                                      {cardCount} card{cardCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </summary>

                                <div className="p-3 border-t border-gray-300 bg-white space-y-3">
                                  {/* Add Cards Section */}
                                  <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                                    <label className="text-xs font-semibold text-gray-700 block mb-2">
                                      Add Cards to {parallel}:
                                    </label>
                                    <textarea
                                      id={`textarea-${set.id || idx}-${pIdx}`}
                                      placeholder={hasVariableSerials
                                        ? `Paste with serial numbers: 'Card# Player, Team /serial' (e.g., '2 Giovani Lo Celso, Argentina /149')`
                                        : `Paste checklist for ${parallel}`}
                                      rows={3}
                                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs text-gray-500 italic">
                                        {hasVariableSerials
                                          ? "Format: Card# Player, Team /serial"
                                          : "Standard checklist"}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const textarea = document.getElementById(`textarea-${set.id || idx}-${pIdx}`) as HTMLTextAreaElement;
                                          const text = textarea?.value.trim();

                                          if (!text) {
                                            setMessage({ type: "error", text: "Please paste checklist data first" });
                                            setTimeout(() => setMessage(null), 3000);
                                            return;
                                          }

                                          if (!set.id) {
                                            setMessage({ type: "error", text: "Please save the set first" });
                                            setTimeout(() => setMessage(null), 3000);
                                            return;
                                          }

                                          console.log('🎯 Parsing text for parallel:', parallel);
                                          console.log('📝 Input text:', text);
                                          const cards = parseCardsWithSerialNumbers(text, set.name);
                                          console.log('✅ Parsed cards:', cards);

                                          if (cards.length === 0) {
                                            setMessage({ type: "error", text: "No cards found. Check format." });
                                            setTimeout(() => setMessage(null), 3000);
                                            return;
                                          }

                                          setMessage({ type: "success", text: `Creating ${cards.length} cards...` });

                                          console.log('💾 Creating cards in database for parallel:', parallel);
                                          await createCardsInDatabase(set.id, cards, [parallel], true);

                                          setMessage({ type: "success", text: `✓ Added ${cards.length} cards` });
                                          setTimeout(() => setMessage(null), 3000);

                                          textarea.value = '';

                                        }}
                                        className="px-3 py-1 bg-footy-green hover:bg-green-800 text-white text-xs rounded transition-colors"
                                      >
                                        Add Cards
                                      </button>
                                    </div>
                                  </div>

                                  {/* Cards Grid - Only show if cards exist */}
                                  {cardCount > 0 && (
                                    <div>
                                      <h4 className="text-xs font-semibold text-gray-700 mb-2">
                                        Cards in {parallel}:
                                      </h4>
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                                        {parallelCards
                                          .sort((a, b) => parseInt(a.cardNumber || '0') - parseInt(b.cardNumber || '0'))
                                          .map((card) => (
                                          <div
                                            key={card.id}
                                            className="border border-gray-200 rounded p-2 bg-gray-50 text-xs"
                                          >
                                            <div className="font-bold text-footy-green">
                                              #{card.cardNumber}
                                            </div>
                                            <div className="text-gray-900 font-medium truncate">
                                              {card.playerName}
                                            </div>
                                            {card.team && (
                                              <div className="text-gray-600 text-xs truncate">
                                                {card.team}
                                              </div>
                                            )}
                                            {card.serialNumber && (
                                              <div className="text-orange-600 font-semibold text-xs mt-1">
                                                /{card.serialNumber}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <details className="text-sm" open>
                            <summary className="cursor-pointer text-green-600 hover:underline font-medium">
                              📋 Paste set data
                            </summary>
                            <div className="mt-2">
                              <textarea
                                placeholder={set.manualSerialMode
                                  ? "Paste cards with serial numbers: 'Card# Player, Team /serial' (e.g., '2 Giovani Lo Celso, Argentina /149')"
                                  : "Paste Set info format: Set Name, # Cards, Parallel info, Checklist"}
                                rows={4}
                                onChange={(e) => {
                                  if (e.target.value.trim()) {
                                    handleChecklistPaste(idx, e.target.value);
                                    e.target.value = ''; // Clear after processing
                                  }
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-mono"
                              />
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {set.manualSerialMode
                                  ? "Format: Card# Player, Team /serial (one per line)"
                                  : "Data will auto-load when pasted and show below ↓"}
                              </p>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {(set.cards && set.cards.length > 0) || (set.parallels && set.parallels.length > 0) ? (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-green-700">
                              Loaded:
                            </span>
                            {set.cards && set.cards.length > 0 && (
                              <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                                {set.cards.length} cards
                              </span>
                            )}
                            {set.parallels && set.parallels.length > 0 && (
                              <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                                {set.parallels.length} parallels
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleClearChecklist(idx);
                              handleClearParallels(idx);
                            }}
                            className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                            title="Clear all data"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-2">
                          {set.cards && set.cards.length > 0 && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-green-600 hover:underline">
                                View cards ({set.cards.length})
                              </summary>
                              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                {set.cards.map((card, cardIdx) => (
                                  <div key={cardIdx} className="text-xs text-gray-700">
                                    #{card.cardNumber} {card.playerName}
                                    {card.team && ` (${card.team})`}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                          {set.parallels && set.parallels.length > 0 && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-green-600 hover:underline">
                                View parallels ({set.parallels.length})
                              </summary>
                              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                {sortParallelsByPrintRun(set.parallels).map((parallel, parallelIdx) => (
                                  <div key={parallelIdx} className="text-xs text-gray-700">
                                    • {parallel}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Nested Parallel Sets Display */}
                    {set.parallelSets && set.parallelSets.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          Parallel Sets ({set.parallelSets.length})
                        </h4>
                        <p className="text-xs text-green-700 mb-3">
                          These parallel sets inherit the checklist from the parent &quot;{set.name}&quot; set
                        </p>
                        <div className="space-y-2">
                          {set.parallelSets.map((parallel, pIdx) => {
                            // The parallel name already includes the print run (e.g., "Electric Etch Green /5")
                            // so we don't need to append it again
                            const parallelDisplayName = parallel.name;

                            return (
                            <div key={parallel.id || pIdx} className="bg-white border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">
                                    {parallelDisplayName}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {parallel.totalCards} cards • Inherits parent checklist
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Delete parallel set "${parallel.name}"?`)) {
                                      try {
                                        const response = await fetch(`/api/sets?id=${parallel.id}`, {
                                          method: 'DELETE',
                                        });
                                        if (response.ok) {
                                          setMessage({ type: 'success', text: `Deleted "${parallel.name}"` });
                                          setTimeout(() => setMessage(null), 3000);
                                          // Refresh the page data
                                          await fetchRelease();
                                        } else {
                                          throw new Error('Failed to delete parallel set');
                                        }
                                      } catch (error) {
                                        console.error('Failed to delete parallel set:', error);
                                        setMessage({ type: 'error', text: 'Failed to delete parallel set' });
                                        setTimeout(() => setMessage(null), 5000);
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                                  title="Delete parallel set"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No sets yet. Click &ldquo;Add Set&rdquo; to create your first set.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-footy-green to-green-700 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Cancel
          </button>
        </div>
    </AdminLayout>
  );
}
