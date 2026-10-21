/**
 * RailSaathi AI Assistant - Core Natural Language Understanding & State Manager
 * Independent, production-grade module for voice and text form automation.
 */

(function (global) {
  'use strict';

  // Seed default railway personnel records in case database is loading/offline
  const DEFAULT_EMPLOYEES = [
    { id: 'seed-1', name: 'Ramesh Kumar', phone: '9876543210' },
    { id: 'seed-2', name: 'Suresh Kumar', phone: '9876543211' },
    { id: 'seed-3', name: 'Amit Kumar', phone: '9876543212' },
    { id: 'seed-4', name: 'Raj Kumar', phone: '9876543213' },
    { id: 'seed-5', name: 'Rajesh Kumar', phone: '9876543214' },
    { id: 'seed-6', name: 'Raj Kumar Singh', phone: '9876543215' },
    { id: 'seed-7', name: 'Nand Kishor', phone: '9876543216' },
    { id: 'seed-8', name: 'Mukesh Sharma', phone: '9876543217' },
    { id: 'seed-9', name: 'Manoj Verma', phone: '9876543218' },
    { id: 'seed-10', name: 'Anil Yadav', phone: '9876543219' },
    { id: 'seed-11', name: 'Dharmendra Singh', phone: '9876543220' },
    { id: 'seed-12', name: 'Sunil Gupta', phone: '9876543221' },
    { id: 'seed-13', name: 'Vikas Patel', phone: '9876543222' },
    { id: 'seed-14', name: 'Sanjay Meena', phone: '9876543223' },
    { id: 'seed-15', name: 'Dinesh Sharma', phone: '9876543224' },
    { id: 'seed-16', name: 'Rahul Kumar', phone: '9876543225' },
    { id: 'seed-17', name: 'Ajay Kumar', phone: '9876543226' }
  ];

  const MONTH_NAMES = {
    'jan': '01', 'january': '01', 'जनवरी': '01',
    'feb': '02', 'february': '02', 'फरवरी': '02',
    'mar': '03', 'march': '03', 'मार्च': '03',
    'apr': '04', 'april': '04', 'अप्रैल': '04',
    'may': '05', 'मई': '05',
    'jun': '06', 'june': '06', 'जून': '06',
    'jul': '07', 'july': '07', 'जुलाई': '07',
    'aug': '08', 'august': '08', 'अगस्त': '08',
    'sep': '09', 'sept': '09', 'september': '09', 'सितंबर': '09', 'सितम्बर': '09',
    'oct': '10', 'october': '10', 'अक्टूबर': '10', 'अक्टूबर': '10',
    'nov': '11', 'november': '11', 'नवंबर': '11', 'नवम्बर': '11',
    'dec': '12', 'december': '12', 'दिसंबर': '12', 'दिसम्बर': '12'
  };

  const WORD_TO_NUM = {
    'one': 1, 'first': 1, '1st': 1, 'पहला': 1, 'एक': 1,
    'two': 2, 'second': 2, '2nd': 2, 'दूसरा': 2, 'दो': 2,
    'three': 3, 'third': 3, '3rd': 3, 'तीसरा': 3, 'तीन': 3,
    'four': 4, 'fourth': 4, '4th': 4, 'चौथा': 4, 'चार': 4,
    'five': 5, 'fifth': 5, '5th': 5, 'पांचवां': 5, 'पाँच': 5, 'पांच': 5,
    'six': 6, 'sixth': 6, '6th': 6, 'छठा': 6, 'छह': 6, 'छः': 6,
    'seven': 7, 'seventh': 7, '7th': 7, 'सात': 7,
    'eight': 8, 'eighth': 8, '8th': 8, 'आठ': 8
  };

  class RailSaathiAI {
    constructor() {
      this.state = this.getInitialState();
      this.history = [];
      this.pendingContext = null;
      this.listeners = [];
      this.speechRecognition = null;
      this.isListening = false;
      this.currentLang = 'en-IN';
      this.initSpeechRecognition();
    }

    getInitialState() {
      return {
        fromDate: '',
        toDate: '',
        dutyType: 'night',
        bits: {
          1: { personnel: '', mobile: '', gps: '' },
          2: { personnel: '', mobile: '', gps: '' },
          3: { personnel: '', mobile: '', gps: '' },
          4: { personnel: '', mobile: '', gps: '' },
          5: { personnel: '', mobile: '', gps: '' },
          6: { personnel: '', mobile: '', gps: '' }
        }
      };
    }

    // ==========================================
    // EMPLOYEE DATABASE ACCESS
    // ==========================================
    getEmployeeList() {
      if (typeof window !== 'undefined' && Array.isArray(window.employeeList) && window.employeeList.length > 0) {
        return window.employeeList;
      }
      return DEFAULT_EMPLOYEES;
    }

    searchPersonnel(query) {
      if (!query || typeof query !== 'string') {
        return { status: 'NONE', query: '', candidates: [] };
      }

      const q = query.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      const list = this.getEmployeeList();

      if (!q) return { status: 'NONE', query: '', candidates: [] };

      // 1. Exact match
      const exactMatches = list.filter(emp => {
        const name = (emp.name || '').trim().toLowerCase();
        return name === q;
      });

      if (exactMatches.length === 1) {
        return { status: 'EXACT', match: exactMatches[0], candidates: exactMatches };
      }

      // 2. Word boundary / Substring match
      const subMatches = list.filter(emp => {
        const name = (emp.name || '').trim().toLowerCase();
        if (name === q) return true;
        // Contains as word
        const words = name.split(/\s+/);
        const qWords = q.split(/\s+/);
        if (qWords.every(qw => words.some(w => w.startsWith(qw) || w === qw))) return true;
        return name.includes(q);
      });

      if (subMatches.length === 1) {
        return { status: 'EXACT', match: subMatches[0], candidates: subMatches };
      } else if (subMatches.length > 1) {
        // If user typed exact full name that matches one of the submatches exactly
        const perfect = subMatches.find(emp => (emp.name || '').trim().toLowerCase() === q);
        if (perfect) {
          return { status: 'EXACT', match: perfect, candidates: subMatches };
        }
        return { status: 'MULTIPLE', query: query.trim(), candidates: subMatches };
      }

      return { status: 'NONE', query: query.trim(), candidates: [] };
    }

    // ==========================================
    // MOBILE NUMBER VALIDATION & NORMALIZATION
    // ==========================================
    normalizeMobile(text) {
      if (!text) return null;
      // Remove all non-digits except +
      let cleaned = String(text).replace(/[^\d+]/g, '');
      if (cleaned.startsWith('+91')) {
        cleaned = cleaned.substring(3);
      } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2);
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = cleaned.substring(1);
      }

      if (/^\d{10}$/.test(cleaned)) {
        return cleaned;
      }
      return null;
    }

    validateMobileInput(text) {
      const normalized = this.normalizeMobile(text);
      if (normalized) {
        return { valid: true, mobile: normalized };
      }
      // Check if user gave an incomplete number
      const digitsOnly = String(text).replace(/[^\d]/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        return {
          valid: false,
          error: "That doesn't look like a valid 10-digit mobile number. Please provide the complete 10-digit mobile number."
        };
      }
      return {
        valid: false,
        error: "Invalid mobile number. Please provide a standard 10-digit mobile number."
      };
    }

    // ==========================================
    // DATE PARSER & VALIDATOR
    // ==========================================
    parseSingleDate(str, baseYear = 2026) {
      if (!str) return null;
      let text = String(str).trim().toLowerCase().replace(/^[,\s;:\(\)]+|[,\s;:\(\)]+$/g, '');

      // Handle keywords
      const today = new Date();
      if (text === 'today' || text === 'आज') {
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      if (text === 'tomorrow' || text === 'कल') {
        const tom = new Date(today);
        tom.setDate(today.getDate() + 1);
        const y = tom.getFullYear();
        const m = String(tom.getMonth() + 1).padStart(2, '0');
        const d = String(tom.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }

      // Pattern 1: dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
      const dmyMatch = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
      if (dmyMatch) {
        const d = String(dmyMatch[1]).padStart(2, '0');
        const m = String(dmyMatch[2]).padStart(2, '0');
        const y = dmyMatch[3];
        return `${y}-${m}-${d}`;
      }

      // Pattern 2: yyyy-mm-dd
      const ymdMatch = text.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
      if (ymdMatch) {
        const y = ymdMatch[1];
        const m = String(ymdMatch[2]).padStart(2, '0');
        const d = String(ymdMatch[3]).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }

      // Pattern 3: dd Month yyyy or dd Month (e.g. 24 September 2026 or 24 Sep)
      const monthRegex = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|सितम्बर|अक्टूबर|नवंबर|नवम्बर|दिसंबर|दिसम्बर)/i;
      
      const textWithMonthMatch1 = text.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthRegex.source})(?:\\s+(\\d{4}))?`, 'i'));
      if (textWithMonthMatch1) {
        const d = String(textWithMonthMatch1[1]).padStart(2, '0');
        const mStr = textWithMonthMatch1[2].toLowerCase();
        const m = MONTH_NAMES[mStr] || '09';
        const y = textWithMonthMatch1[3] || String(baseYear);
        return `${y}-${m}-${d}`;
      }

      // Pattern 4: Month dd yyyy or Month dd (e.g. September 24 2026)
      const textWithMonthMatch2 = text.match(new RegExp(`(${monthRegex.source})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`, 'i'));
      if (textWithMonthMatch2) {
        const mStr = textWithMonthMatch2[1].toLowerCase();
        const m = MONTH_NAMES[mStr] || '09';
        const d = String(textWithMonthMatch2[2]).padStart(2, '0');
        const y = textWithMonthMatch2[3] || String(baseYear);
        return `${y}-${m}-${d}`;
      }

      return null;
    }

    formatDisplayDate(isoDate) {
      if (!isoDate) return '';
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return isoDate;
    }

    parseDateRange(text) {
      if (!text) return null;
      let raw = String(text).trim();

      // 1. Check standard "from X to Y" first
      const fromToMatch = raw.match(/\bfrom\s+(.*?)\s+(?:to|-)\s+(.*?)(?:$|\s+(?:assign|bit|beat|mobile|\.|,))/i) ||
                          raw.match(/\bdate\s+(?:from\s+)?(.*?)\s+(?:to|-)\s+(.*?)(?:$|\s+(?:assign|bit|beat|mobile|\.|,))/i);

      if (fromToMatch) {
        let part1 = fromToMatch[1].trim().replace(/^[,\s;:\(\)]+|[,\s;:\(\)]+$/g, '');
        let part2 = fromToMatch[2].trim().replace(/^[,\s;:\(\)]+|[,\s;:\(\)]+$/g, '');
        const date1 = this.parseSingleDate(part1);
        const date2 = this.parseSingleDate(part2);

        if (date1 && date2) {
          return this.validateDateRange(date1, date2);
        }
      }

      // 2. Check for "From 24 to 26 September 2026" (shared month/year)
      const shortRangeMatch = raw.match(/\bfrom\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|-)\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z\u0900-\u097F]+)(?:\s+(\d{4}))?/i) ||
                              raw.match(/(?<!\d\s*)\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|-)\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z\u0900-\u097F]+)(?:\s+(\d{4}))?/i);
      
      if (shortRangeMatch) {
        const d1 = shortRangeMatch[1];
        const d2 = shortRangeMatch[2];
        const monthWord = shortRangeMatch[3].toLowerCase();
        const year = shortRangeMatch[4] || '2026';
        if (MONTH_NAMES[monthWord]) {
          const date1 = this.parseSingleDate(`${d1} ${monthWord} ${year}`);
          const date2 = this.parseSingleDate(`${d2} ${monthWord} ${year}`);
          if (date1 && date2) {
            return this.validateDateRange(date1, date2);
          }
        }
      }

      // 3. Check single date
      const singleDate = this.parseSingleDate(raw);
      if (singleDate) {
        return { fromDate: singleDate, toDate: null, isValid: true };
      }

      return null;
    }

    validateDateRange(from, to) {
      if (from && to && from > to) {
        return {
          fromDate: from,
          toDate: to,
          isValid: false,
          error: `From Date (${this.formatDisplayDate(from)}) cannot be after To Date (${this.formatDisplayDate(to)}). Please correct the date range.`
        };
      }
      return {
        fromDate: from,
        toDate: to,
        isValid: true
      };
    }

    // ==========================================
    // BIT NUMBER PARSER
    // ==========================================
    parseBitIndex(text) {
      if (!text) return null;
      const str = String(text).toLowerCase();

      // Explicit pattern: bit 1, bit no 1, bit-1, beat 1, etc.
      const match = str.match(/\b(?:bit|beat|बिट)\s*(?:no\.?|number|num\.?)?\s*[-:]?\s*(\d+|one|two|three|four|five|six|seven|eight|first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th|पहला|दूसरा|तीसरा|चौथा|पांचवां|छठा)\b/i) ||
                    str.match(/\b(first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th|पहला|दूसरा|तीसरा|चौथा|पांचवां|छठा)\s+(?:bit|beat|बिट)\b/i);

      if (match) {
        const val = match[1].toLowerCase();
        if (/^\d+$/.test(val)) {
          const num = parseInt(val, 10);
          if (num >= 1 && num <= 8) return num;
        }
        if (WORD_TO_NUM[val]) {
          return WORD_TO_NUM[val];
        }
      }

      return null;
    }

    // ==========================================
    // MAIN NATURAL LANGUAGE UNDERSTANDING ENGINE
    // ==========================================
    processInput(userInput) {
      const input = (userInput || '').trim();
      if (!input) {
        return {
          action: 'NO_OP',
          message: 'Please provide a voice instruction or text command.'
        };
      }

      // Check for pending conversation context (e.g. user answering mobile or personnel selection)
      if (this.pendingContext) {
        const resolved = this.handlePendingContext(input);
        if (resolved) return resolved;
      }

      const lower = input.toLowerCase();

      // 1. HELP / GREETING
      if (/^(hi|hello|hey|help|नमस्ते|सहायता|options|commands)\b/i.test(lower) && lower.length < 25) {
        return {
          action: 'HELP',
          message: `👋 **RailSaathi AI Assistant is ready!**\n\nYou can speak or type natural commands like:\n• *"From 24 September to 26 September, assign Ramesh Kumar to BIT 1, mobile 9876543210"*\n• *"Assign Suresh Kumar to BIT 2"*\n• *"Change BIT 2 mobile to 9876543215"*\n• *"Clear BIT 4"*\n• *"Generate preview"*`
        };
      }

      // 2. UNDO COMMAND
      if (/^(undo|undo that|revert|वापस|undo last change)/i.test(lower)) {
        return this.undo();
      }

      // 3. GENERATE PREVIEW COMMAND
      if (/^(generate preview|preview|show preview|make preview|प्रिंट|प्रिव्यू)/i.test(lower)) {
        return this.handlePreviewTrigger();
      }

      // 4. CLEAR / REMOVE BIT COMMAND
      const clearMatch = lower.match(/\b(?:clear|remove|delete|reset|हटाएं|हटाओ|खाली करो)\s+(?:bit|beat|बिट)\s*(\d+|one|two|three|four|five|six)\b/i) ||
                         lower.match(/\b(?:bit|beat|बिट)\s*(\d+|one|two|three|four|five|six)\s+(?:clear|remove|delete|reset|हटाएं|हटाओ)\b/i);
      if (clearMatch) {
        let bitNum = clearMatch[1];
        if (WORD_TO_NUM[bitNum]) bitNum = WORD_TO_NUM[bitNum];
        bitNum = parseInt(bitNum, 10);
        if (bitNum >= 1 && bitNum <= 6) {
          return this.clearBit(bitNum);
        }
      }

      // 5. PARSE MULTI-BIT OR COMPREHENSIVE COMMANDS
      return this.parseFullFormCommand(input);
    }

    handlePendingContext(input) {
      const ctx = this.pendingContext;
      const lower = input.toLowerCase().trim();

      // If user wants to cancel
      if (lower === 'cancel' || lower === 'रद्द' || lower === 'stop' || lower === 'never mind') {
        this.pendingContext = null;
        return {
          action: 'CANCEL',
          message: 'Operation cancelled.'
        };
      }

      // Case A: Missing Mobile Number for a BIT
      if (ctx.type === 'CLARIFY_MOBILE') {
        const valRes = this.validateMobileInput(input);
        if (!valRes.valid) {
          return {
            action: 'ASK_CLARIFICATION',
            message: `${valRes.error}\n\nWhat mobile number should I use for ${ctx.personnelName} on BIT ${ctx.bitIndex}?`,
            pendingContext: ctx
          };
        }

        // Apply mobile
        this.pushHistory(`Added mobile for BIT ${ctx.bitIndex}`);
        this.state.bits[ctx.bitIndex].mobile = valRes.mobile;
        if (ctx.personnelName) {
          this.state.bits[ctx.bitIndex].personnel = ctx.personnelName;
        }

        this.pendingContext = null;
        this.applyStateToDOM([ctx.bitIndex]);

        return {
          action: 'UPDATE_FORM',
          changes: {
            bits: { [ctx.bitIndex]: { mobile: valRes.mobile, personnel: ctx.personnelName } }
          },
          message: `Got it. BIT ${ctx.bitIndex} has been filled with ${ctx.personnelName} and mobile ${valRes.mobile}.`,
          formStatus: this.getFormStatus()
        };
      }

      // Case B: Ambiguous Personnel Selection
      if (ctx.type === 'SELECT_PERSONNEL') {
        // Find which candidate matched
        const chosen = ctx.candidates.find(c => {
          const cName = (c.name || '').toLowerCase();
          return cName === lower || cName.includes(lower) || lower.includes(cName);
        });

        if (chosen) {
          this.pushHistory(`Assigned ${chosen.name} to BIT ${ctx.bitIndex}`);
          this.state.bits[ctx.bitIndex].personnel = chosen.name;
          if (chosen.phone && !this.state.bits[ctx.bitIndex].mobile) {
            this.state.bits[ctx.bitIndex].mobile = chosen.phone;
          }

          this.pendingContext = null;
          this.applyStateToDOM([ctx.bitIndex]);

          return {
            action: 'UPDATE_FORM',
            changes: {
              bits: { [ctx.bitIndex]: { personnel: chosen.name, mobile: chosen.phone || '' } }
            },
            message: `Selected **${chosen.name}** for BIT ${ctx.bitIndex}${chosen.phone ? ` with mobile ${chosen.phone}` : ''}.`,
            formStatus: this.getFormStatus()
          };
        }

        // If not matching any candidate, see if new full command or re-prompt
        return {
          action: 'SELECT_PERSONNEL',
          message: `Please select one of the matching personnel:\n${ctx.candidates.map(c => `• **${c.name}** (${c.phone || 'No phone'})`).join('\n')}`,
          candidates: ctx.candidates,
          pendingContext: ctx
        };
      }

      return null;
    }

    parseFullFormCommand(input) {
      this.syncFromDOM();

      const previousStateSnapshot = JSON.parse(JSON.stringify(this.state));

      const changes = {
        bits: {}
      };
      const messages = [];
      let hasUpdates = false;
      const changedBitIndices = [];

      // 1. EXTRACT DATE RANGE
      const dateRes = this.parseDateRange(input);
      if (dateRes) {
        if (dateRes.error) {
          return {
            action: 'VALIDATION_ERROR',
            error: dateRes.error,
            message: `⚠️ ${dateRes.error}`
          };
        }
        if (dateRes.fromDate) {
          changes.fromDate = dateRes.fromDate;
          this.state.fromDate = dateRes.fromDate;
          hasUpdates = true;
        }
        if (dateRes.toDate) {
          changes.toDate = dateRes.toDate;
          this.state.toDate = dateRes.toDate;
          hasUpdates = true;
        }
        if (dateRes.fromDate && dateRes.toDate) {
          messages.push(`📅 **Dates:** ${this.formatDisplayDate(dateRes.fromDate)} to ${this.formatDisplayDate(dateRes.toDate)}`);
        } else if (dateRes.fromDate) {
          messages.push(`📅 **From Date:** ${this.formatDisplayDate(dateRes.fromDate)}`);
        }
      }

      // 2. EXTRACT BIT COMMANDS (Multi-BIT support or single BIT)
      // Split input by bit mentions or newlines / periods
      const bitSegments = this.splitIntoBitSegments(input);

      for (const segment of bitSegments) {
        const bitIndex = segment.bitIndex || this.parseBitIndex(segment.text);
        if (!bitIndex) continue;

        // Check if user is changing mobile only
        const mobileOnlyMatch = segment.text.match(/(?:change|update|set)?\s*(?:mobile|phone|मोबाईल|फोन|नंबर|no\.?)\s*(?:to|is|=)?\s*(\+?[\d\s-]{5,14})/i) ||
                                segment.text.match(/mobile\s*(?:no\.?|number)?\s*(?:to|is|=)?\s*(\+?[\d\s-]{5,14})/i);

        const extractedMobile = this.extractMobileFromText(segment.text);
        const extractedPersonnelQuery = this.extractPersonnelQuery(segment.text, bitIndex, extractedMobile);

        // Sub-case A: Changing only mobile of existing BIT
        if (mobileOnlyMatch && !extractedPersonnelQuery) {
          const mobileVal = mobileOnlyMatch[1];
          const valRes = this.validateMobileInput(mobileVal);
          if (!valRes.valid) {
            return {
              action: 'VALIDATION_ERROR',
              message: `⚠️ BIT ${bitIndex}: ${valRes.error}`
            };
          }

          this.state.bits[bitIndex].mobile = valRes.mobile;
          changes.bits[bitIndex] = { mobile: valRes.mobile };
          changedBitIndices.push(bitIndex);
          hasUpdates = true;
          messages.push(`📱 **BIT ${bitIndex}:** Mobile updated to ${valRes.mobile}`);
          continue;
        }

        // Sub-case B: Personnel Assignment (with or without mobile)
        if (extractedPersonnelQuery) {
          const searchRes = this.searchPersonnel(extractedPersonnelQuery);

          if (searchRes.status === 'NONE') {
            return {
              action: 'UNKNOWN_PERSONNEL',
              message: `❌ I couldn't find "${extractedPersonnelQuery}" in the personnel list. Please select an existing personnel or add the employee first.`,
              query: extractedPersonnelQuery
            };
          }

          if (searchRes.status === 'MULTIPLE') {
            this.pendingContext = {
              type: 'SELECT_PERSONNEL',
              bitIndex: bitIndex,
              candidates: searchRes.candidates,
              originalQuery: extractedPersonnelQuery
            };
            return {
              action: 'SELECT_PERSONNEL',
              message: `🔍 I found multiple matching personnel for "${extractedPersonnelQuery}". Which one do you mean?\n${searchRes.candidates.map(c => `• **${c.name}** (${c.phone || 'No mobile'})`).join('\n')}`,
              candidates: searchRes.candidates,
              bitIndex: bitIndex,
              pendingContext: this.pendingContext
            };
          }

          const matchedEmp = searchRes.match;
          let mobileToUse = extractedMobile;

          // If mobile was not in command, check if employee record has phone
          if (!mobileToUse && matchedEmp.phone) {
            mobileToUse = matchedEmp.phone;
          }

          // If mobile is still missing and this is a single bit command, ask user
          if (!mobileToUse && bitSegments.length === 1) {
            this.state.bits[bitIndex].personnel = matchedEmp.name;
            this.pendingContext = {
              type: 'CLARIFY_MOBILE',
              bitIndex: bitIndex,
              personnelName: matchedEmp.name
            };
            this.applyStateToDOM([bitIndex]);
            return {
              action: 'ASK_CLARIFICATION',
              message: `✅ BIT ${bitIndex} is set to **${matchedEmp.name}**.\n\nWhat mobile number should I use for ${matchedEmp.name}?`,
              bitIndex: bitIndex,
              personnel: matchedEmp.name,
              pendingContext: this.pendingContext,
              formStatus: this.getFormStatus()
            };
          }

          // Validate mobile if explicitly provided
          if (extractedMobile) {
            const valRes = this.validateMobileInput(extractedMobile);
            if (!valRes.valid) {
              return {
                action: 'VALIDATION_ERROR',
                message: `⚠️ BIT ${bitIndex}: ${valRes.error}`
              };
            }
            mobileToUse = valRes.mobile;
          }

          this.state.bits[bitIndex].personnel = matchedEmp.name;
          this.state.bits[bitIndex].mobile = mobileToUse || '';
          changes.bits[bitIndex] = {
            personnel: matchedEmp.name,
            mobile: mobileToUse || ''
          };
          changedBitIndices.push(bitIndex);
          hasUpdates = true;
          messages.push(`👤 **BIT ${bitIndex}:** ${matchedEmp.name} ${mobileToUse ? `(${mobileToUse})` : '(No mobile)'}`);
        }
      }

      if (!hasUpdates) {
        return {
          action: 'NO_CHANGE',
          message: `I couldn't understand the form fields in: "${input}".\n\nTry saying: *"From 24 September to 26 September, assign Ramesh Kumar to BIT 1, mobile 9876543210"*`
        };
      }

      // Save previous state to undo history
      this.history.push({
        state: previousStateSnapshot,
        actionDesc: messages.join(', '),
        timestamp: Date.now()
      });
      if (this.history.length > 20) this.history.shift();

      // Apply to DOM
      this.applyStateToDOM(changedBitIndices);

      const summaryText = messages.join('\n');
      return {
        action: 'UPDATE_FORM',
        changes: changes,
        message: `✅ **Form updated successfully!**\n\n${summaryText}`,
        formStatus: this.getFormStatus()
      };
    }

    splitIntoBitSegments(input) {
      // 1. If text has multiple lines or period/comma delimiters, split into clauses
      // Normalize delimiters
      let cleaned = input.replace(/[\n\r]+/g, ' . ').replace(/;\s*/g, ' . ');
      
      // Look for clauses containing BIT mentions
      const clauses = cleaned.split(/\s+[\.\,]\s+|\s+and\s+/i).map(c => c.trim()).filter(Boolean);
      const segments = [];

      for (const clause of clauses) {
        // Does this clause mention a BIT?
        const bitIdx = this.parseBitIndex(clause);
        if (bitIdx) {
          segments.push({ text: clause, bitIndex: bitIdx });
        }
      }

      if (segments.length > 0) {
        return segments;
      }

      // Fallback: If no clauses, search for bit matches
      const regex = /\b(?:bit|beat|बिट|k\s*-\s*\d)\s*(?:no\.?|number|num\.?)?\s*[-:]?\s*(?:\d+|one|two|three|four|five|six|seven|eight|first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th)/gi;
      const indices = [];
      let match;

      while ((match = regex.exec(input)) !== null) {
        indices.push(match.index);
      }

      if (indices.length === 0) {
        return [{ text: input, bitIndex: null }];
      }

      for (let i = 0; i < indices.length; i++) {
        const start = indices[i];
        const end = (i + 1 < indices.length) ? indices[i + 1] : input.length;
        const sub = input.substring(start, end).trim();
        segments.push({
          text: sub,
          bitIndex: this.parseBitIndex(sub)
        });
      }

      return segments;
    }

    extractMobileFromText(text) {
      const match = text.match(/(?:mobile|phone|ph|mob|मोबाईल|नंबर)?\s*(?:no\.?|number)?\s*[:=]?\s*(\+?91[\s-]?)?([6-9]\d{9})\b/) ||
                    text.match(/\b(\+?91[\s-]?)?([6-9]\d{9})\b/);
      if (match) {
        return match[2];
      }
      // Incomplete number check
      const shortMatch = text.match(/(?:mobile|phone|ph|mob)?\s*(?:no\.?|number)?\s*[:=]?\s*(\d{4,9})\b/);
      if (shortMatch && !shortMatch[0].includes('2026') && !shortMatch[0].includes('2025')) {
        return shortMatch[1];
      }
      return null;
    }

    extractPersonnelQuery(text, bitIndex, knownMobile) {
      let clean = text;

      // Remove date mentions if present in this clause
      clean = clean.replace(/from\s+.*?to\s+.*?(?:assign|bit|beat|,|$)/i, ' ');
      clean = clean.replace(/\b(?:from|to)?\s*\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?/gi, ' ');
      clean = clean.replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, ' ');

      // Remove bit phrases: "assign to bit 1", "to bit 1", "bit 1", "for bit 1", "on bit 1"
      clean = clean.replace(/\b(?:assign|set|change|put|add|give|update|replace)?\s*(?:to|for|on|in)?\s*(?:bit|beat|बिट)\s*(?:no\.?|number|num\.?)?\s*[-:]?\s*(?:\d+|one|two|three|four|five|six|seven|eight|first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th)\b/gi, '');
      clean = clean.replace(/\b(?:first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th)\s+(?:bit|beat|बिट)\b/gi, '');

      // Remove mobile part including words "mobile", "phone", "number", "to", etc.
      if (knownMobile) {
        clean = clean.replace(new RegExp(`(?:mobile|phone|ph|mob|मोबाईल|फोन|नंबर)?\\s*(?:no\\.?|number|digit)?\\s*(?:to|is|=|as)?\\s*\\+?(?:91)?[\\s-]*${knownMobile}`, 'gi'), '');
      } else {
        clean = clean.replace(/(?:mobile|phone|ph|mob|मोबाईल|फोन|नंबर)?\s*(?:no\.?|number|digit)?\s*(?:to|is|=|as)?\s*\+?(?:91)?[\s-]*\d{5,12}/gi, '');
      }

      // Remove mobile keywords
      clean = clean.replace(/\b(?:mobile|phone|ph|mob|number|no|digits?|मोबाईल|फोन|नंबर)\b/gi, ' ');

      // Remove common prepositions, verbs & filler words
      clean = clean.replace(/\b(?:assign|set|change|update|replace|put|add|to|for|with|and|is|as|duty|personnel|employee|staff|श्री|श्रीमान|को|का|के|लिए|बदलो|करो)\b/gi, ' ');
      clean = clean.replace(/[,\.;:()]/g, ' ').trim();

      if (clean.length >= 2) {
        return clean;
      }
      return null;
    }

    // ==========================================
    // CLEAR / UNDO ACTIONS
    // ==========================================
    clearBit(bitIndex) {
      this.pushHistory(`Cleared BIT ${bitIndex}`);
      this.state.bits[bitIndex] = { personnel: '', mobile: '', gps: '' };
      this.applyStateToDOM([bitIndex]);
      return {
        action: 'CLEAR_BIT',
        bitIndex: bitIndex,
        message: `🗑️ **BIT ${bitIndex}** has been cleared.`,
        formStatus: this.getFormStatus()
      };
    }

    pushHistory(actionDesc) {
      this.history.push({
        state: JSON.parse(JSON.stringify(this.state)),
        actionDesc: actionDesc,
        timestamp: Date.now()
      });
      // Keep max 20 history steps
      if (this.history.length > 20) this.history.shift();
    }

    undo() {
      if (this.history.length === 0) {
        return {
          action: 'UNDO_FAILED',
          message: 'Nothing to undo in this session.'
        };
      }

      const prev = this.history.pop();
      this.state = prev.state;
      this.applyStateToDOM([1, 2, 3, 4, 5, 6]);

      return {
        action: 'UNDO',
        message: `↶ **Undone:** Reverted "${prev.actionDesc}".`,
        formStatus: this.getFormStatus()
      };
    }

    // ==========================================
    // FORM VALIDATION & PREVIEW TRIGGER
    // ==========================================
    getFormStatus() {
      const status = {
        fromDate: !!this.state.fromDate,
        toDate: !!this.state.toDate,
        bits: {}
      };

      for (let i = 1; i <= 6; i++) {
        const b = this.state.bits[i] || {};
        if (b.personnel && b.mobile) {
          status.bits[i] = 'COMPLETE';
        } else if (b.personnel && !b.mobile) {
          status.bits[i] = 'INCOMPLETE';
        } else {
          status.bits[i] = 'EMPTY';
        }
      }

      return status;
    }

    validateForPreview() {
      const errors = [];
      if (!this.state.fromDate) {
        errors.push('From Date is missing');
      }
      if (this.state.dutyType === 'night' && !this.state.toDate) {
        errors.push('To Date is missing');
      }
      if (this.state.fromDate && this.state.toDate && this.state.fromDate > this.state.toDate) {
        errors.push('From Date cannot be greater than To Date');
      }

      let filledBitsCount = 0;
      for (let i = 1; i <= 6; i++) {
        const b = this.state.bits[i];
        if (b && b.personnel) {
          filledBitsCount++;
          if (!b.mobile) {
            errors.push(`BIT ${i} (${b.personnel}) is missing a mobile number`);
          }
        }
      }

      if (filledBitsCount === 0) {
        errors.push('At least one BIT must be assigned');
      }

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }

    handlePreviewTrigger() {
      this.syncFromDOM();
      const validation = this.validateForPreview();

      if (!validation.isValid) {
        return {
          action: 'VALIDATION_FAILED',
          errors: validation.errors,
          message: `⚠️ **Cannot Generate Preview yet:**\n${validation.errors.map(e => `• ${e}`).join('\n')}`
        };
      }

      // If in browser DOM, trigger existing generatePreview()
      if (typeof window !== 'undefined' && typeof window.generatePreview === 'function') {
        try {
          window.generatePreview();
        } catch (e) {
          console.error('Error in window.generatePreview():', e);
        }
      }

      return {
        action: 'PREVIEW_GENERATED',
        message: '📄 **Generate Preview triggered successfully!** Validated all date and BIT assignments.'
      };
    }

    // ==========================================
    // DOM SYNCHRONIZATION
    // ==========================================
    syncFromDOM() {
      if (typeof document === 'undefined') return;

      const fromInput = document.getElementById('fromDate');
      const toInput = document.getElementById('toDate');
      if (fromInput && fromInput.value) this.state.fromDate = fromInput.value;
      if (toInput && toInput.value) this.state.toDate = toInput.value;

      for (let i = 1; i <= 6; i++) {
        const empInput = document.getElementById(`emp-search-${i - 1}`);
        const phoneInput = document.getElementById(`emp-phone-${i - 1}`);
        const gpsInput = document.getElementById(`gps-number-${i - 1}`);

        if (empInput) this.state.bits[i].personnel = empInput.value.trim();
        if (phoneInput) this.state.bits[i].mobile = phoneInput.value.trim();
        if (gpsInput) this.state.bits[i].gps = gpsInput.value.trim();
      }
    }

    applyStateToDOM(changedBitIndices = []) {
      if (typeof document === 'undefined') return;

      const fromInput = document.getElementById('fromDate');
      const toInput = document.getElementById('toDate');

      if (fromInput && this.state.fromDate) {
        fromInput.value = this.state.fromDate;
        this.flashElementHighlight(fromInput);
      }
      if (toInput && this.state.toDate) {
        toInput.value = this.state.toDate;
        this.flashElementHighlight(toInput);
      }

      changedBitIndices.forEach(bitNum => {
        const idx = bitNum - 1;
        const bit = this.state.bits[bitNum];
        if (!bit) return;

        const empInput = document.getElementById(`emp-search-${idx}`);
        const phoneInput = document.getElementById(`emp-phone-${idx}`);
        const card = empInput ? empInput.closest('.duty-bit-card') : null;

        if (empInput) {
          empInput.value = bit.personnel || '';
          empInput.dataset.selectedName = bit.personnel || '';
        }
        if (phoneInput) {
          phoneInput.value = bit.mobile || '';
        }

        // Call existing updateGpsVisibility if present
        if (typeof window.updateGpsVisibility === 'function') {
          window.updateGpsVisibility(idx);
        }

        if (card) {
          this.flashElementHighlight(card);
        }
      });

      this.notifyListeners();
    }

    flashElementHighlight(el) {
      if (!el) return;
      el.classList.add('ai-highlight-glow');
      setTimeout(() => {
        el.classList.remove('ai-highlight-glow');
      }, 1600);
    }

    // ==========================================
    // SPEECH RECOGNITION (WEB SPEECH API)
    // ==========================================
    initSpeechRecognition() {
      if (typeof window === 'undefined') return;

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('SpeechRecognition API not available in this browser');
        return;
      }

      try {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = false;
        this.speechRecognition.lang = this.currentLang;

        this.speechRecognition.onstart = () => {
          this.isListening = true;
          this.notifyListeners('SPEECH_START');
        };

        this.speechRecognition.onresult = (event) => {
          this.isListening = false;
          if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript;
            this.notifyListeners('SPEECH_RESULT', transcript);
          }
        };

        this.speechRecognition.onerror = (event) => {
          this.isListening = false;
          console.warn('Speech recognition error:', event.error);
          this.notifyListeners('SPEECH_ERROR', event.error);
        };

        this.speechRecognition.onend = () => {
          this.isListening = false;
          this.notifyListeners('SPEECH_END');
        };
      } catch (e) {
        console.warn('Failed to initialize SpeechRecognition:', e);
      }
    }

    startListening(onResultCallback, onErrorCallback) {
      if (!this.speechRecognition) {
        if (onErrorCallback) {
          onErrorCallback('Voice input is not supported by your browser. Please use text input instead.');
        }
        return false;
      }

      try {
        this.speechRecognition.lang = this.currentLang;
        this.speechRecognition.start();
        return true;
      } catch (e) {
        console.error('Error starting speech recognition:', e);
        if (onErrorCallback) onErrorCallback(e.message);
        return false;
      }
    }

    stopListening() {
      if (this.speechRecognition && this.isListening) {
        try {
          this.speechRecognition.stop();
        } catch (e) {}
      }
    }

    // Event listener registration
    subscribe(fn) {
      if (typeof fn === 'function') this.listeners.push(fn);
    }

    notifyListeners(eventType, data) {
      this.listeners.forEach(fn => {
        try {
          fn(eventType, data, this.state);
        } catch (e) {}
      });
    }
  }

  // Export for Node.js / Tests and Browser window
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RailSaathiAI, DEFAULT_EMPLOYEES };
  }
  if (typeof window !== 'undefined') {
    window.RailSaathiAI = RailSaathiAI;
    window.railSaathiAIInstance = new RailSaathiAI();
  }

})(typeof window !== 'undefined' ? window : global);
