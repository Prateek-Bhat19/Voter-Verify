require('dotenv').config();
const axios = require('axios');
const ChatbotHistory = require('../models/chatbotModel');
const ChatMessage = require('../models/ChatMessage');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Common responses for fallback
const staticResponses = {
  'who can be a voter': `
## Voter Eligibility in India

To be eligible to vote in Indian elections, a person must:

• Be a **citizen of India**
• Have attained the **age of 18 years** or above on the qualifying date (January 1 of the year of electoral roll revision)
• Be **ordinarily resident** in the constituency where registered
• **Not be disqualified** under provisions of the Representation of the People Act, 1950

**Note:** Non-resident Indians (NRIs) who are citizens of India are also eligible to be enrolled as voters.`,

  'what should a voter do on voting day': `
## Voting Day Procedure in India

On election day, follow these steps:

1. **Check voting time** - Usually 7:00 AM to 6:00 PM
2. **Carry valid ID proof** - Voter ID card, Aadhaar, passport, etc.
3. **Locate your polling booth** - Check your voter slip or ECI website
4. **Stand in queue** - Separate queues for men and women
5. **Verification process** - Officials will verify your identity
6. **Indelible ink** - Ink will be applied on your finger
7. **Electronic voting** - Cast your vote on the EVM by pressing the button
8. **Check VVPAT** - Verify your vote through the VVPAT machine if available

Remember to maintain peace and follow COVID protocols if applicable.`,

  'how to register': `
## Voter Registration Process in India

To register as a voter in India:

1. **Online Registration**:
   • Visit the National Voter Service Portal (NVSP): https://www.nvsp.in/
   • Fill Form 6 for new registration
   • Upload required documents (proof of age, residence, photo)
   • Submit the application

2. **Offline Registration**:
   • Obtain Form 6 from Electoral Registration Office or download it
   • Fill the form with required details
   • Attach necessary documents
   • Submit to local Electoral Registration Officer

**Required Documents**:
• Proof of age (Birth certificate, Aadhaar, passport, etc.)
• Proof of residence (Utility bills, bank statements, etc.)
• Passport-sized photographs

The Electoral Registration Officer will process your application and inform you about the status.`,

  'voter id card': `
## Voter ID Card Information

The Voter ID Card, officially known as the **Electors Photo Identity Card (EPIC)**, is a key document for Indian voters.

**Purpose**:
• Serves as identity proof for voting
• Acts as official government ID for various purposes

**How to Apply**:
• Online through National Voter Service Portal (NVSP)
• Offline at Electoral Registration Office
• Through BLO (Booth Level Officer) during special drives

**Features**:
• Contains voter's photo, name, father's/husband's name
• Has unique EPIC number
• Shows assembly constituency details

**If Lost/Damaged**:
Apply for a duplicate through Form 8 at the Electoral Registration Office or online through NVSP.`,

  'election schedule': `
## Election Schedule in India

Elections in India are conducted by the Election Commission of India (ECI), an autonomous constitutional authority.

**General Election (Lok Sabha)**:
• Held every 5 years
• 543 constituencies across India
• Usually conducted in multiple phases spanning several weeks

**State Assembly Elections**:
• Held every 5 years for each state
• Schedule varies by state
• May coincide with general elections or be held separately

**Current/Upcoming Elections**:
For the most current election schedules, please visit the official Election Commission of India website at https://eci.gov.in/

The Election Commission announces the detailed schedule including nomination dates, polling dates, and counting dates a few weeks before the elections.`,

  'polling booth': `
## Polling Booth Information

To find your polling booth:

1. **Online Method**:
   • Visit the National Voter Service Portal (NVSP): https://www.nvsp.in/
   • Click on "Search Your Name in Electoral Roll"
   • Enter your details (EPIC number or personal details)
   • Your polling booth details will be displayed

2. **Offline Method**:
   • Contact your local Electoral Registration Officer
   • Visit the nearest Election Commission office
   • Check your voter slip received during registration

3. **Mobile App**:
   • Download the Voter Helpline App
   • Enter your EPIC number or personal details
   • View your polling booth location on the map

Remember to carry your Voter ID card when visiting the polling booth.`,

  'voting rights': `
## Voting Rights in India

As an Indian citizen, you have the following voting rights:

1. **Right to Vote**:
   • Every citizen above 18 years has the right to vote
   • No discrimination based on caste, religion, gender, or education
   • Voting is a fundamental right under Article 326 of the Constitution

2. **Right to Information**:
   • Access to information about candidates
   • Know about election procedures
   • Get details about polling booths

3. **Right to Secrecy**:
   • Your vote is confidential
   • No one can force you to reveal your choice
   • EVMs ensure complete secrecy

4. **Right to Complaint**:
   • Report electoral malpractices
   • File complaints about polling issues
   • Contact Election Commission for grievances`,

  'election commission': `
## Election Commission of India (ECI)

The Election Commission of India is an autonomous constitutional authority responsible for administering elections.

**Functions**:
• Conducting free and fair elections
• Supervising election process
• Implementing Model Code of Conduct
• Registering political parties
• Allocating election symbols

**Contact Information**:
• Website: https://eci.gov.in/
• Helpline: 1950
• Email: complaints@eci.gov.in
• Address: Nirvachan Sadan, Ashoka Road, New Delhi - 110001`,

  'voter list': `
## Electoral Roll Information

The electoral roll (voter list) is a list of all eligible voters in a constituency.

**How to Check Your Name**:
1. Visit https://www.nvsp.in/
2. Click on "Search Your Name in Electoral Roll"
3. Enter your details (EPIC number or personal information)
4. View your details in the electoral roll

**If Your Name is Missing**:
• Submit Form 6 for new registration
• Contact your local Electoral Registration Officer
• Visit the nearest Election Commission office

**Roll Revision**:
• Annual revision of electoral rolls
• Special summary revision before elections
• Claims and objections can be filed during revision`,

  'election results': `
## Election Results Information

Election results in India are declared by the Election Commission of India.

**How to Check Results**:
• Visit the official ECI website: https://eci.gov.in/
• Check the Voter Helpline App
• Watch official ECI press conferences
• Follow ECI social media channels

**Result Declaration Process**:
1. Counting of votes at designated centers
2. Verification of EVM and VVPAT records
3. Declaration of results by Returning Officer
4. Official notification by Election Commission

**Important Note**: Results are final and binding. Any disputes must be resolved through the judicial process.`
};

// Default response for general queries
const defaultResponse = `
## Welcome to E-Voting Support

I'm your voting assistant and I can help you with:

• Voter registration process
• Voter ID card information
• Election schedules and dates
• Voting day procedures
• Voter eligibility criteria
• Polling booth locations
• Voting rights and responsibilities
• Election Commission information
• Electoral roll details
• Election results

Please ask me a question about any of these topics, and I'll provide you with detailed information.

For example, you can ask:
- How do I register to vote?
- What documents do I need for voter ID?
- When are the next elections?
- What should I do on voting day?
- Who is eligible to vote in India?
- Where is my polling booth?
- What are my voting rights?
- How to check election results?`;

exports.getChatbotResponse = async (req, res) => {
    try {
        // Check if API key is configured
        if (!GEMINI_API_KEY) {
            console.error("Gemini API key is not configured");
            return handleStaticResponse(req, res);
        }

        const { message, userId, roomId } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: "Message is required",
                message: "Please enter a message"
            });
        }

        // Create a room ID if not provided
        const chatRoomId = roomId || (userId ? `user_${userId}` : `guest_${Date.now()}`);

        const prompt = `You are an India-specific voter assistance chatbot. Your role is to help users with information about Indian elections and voting procedures. 
        Please provide accurate, helpful, and concise information in a clear, structured format.

        When explaining eligibility criteria or requirements, use bullet points or numbered lists.
        When providing step-by-step instructions, use numbered lists.
        
        Always format your responses with:
        - Clear headings using markdown (## for main headings, ### for subheadings)
        - Proper spacing between sections
        - Bullet points (•) for lists
        - Bold text (**text**) for important terms or requirements
        - Numbered lists (1., 2., etc.) for steps
        
        Focus on providing information about:
        - Voter registration process
        - Voter ID card
        - Election procedures
        - Polling booth locations
        - Voting rights and responsibilities
        - Election dates and schedules
        
        If the query is not related to Indian voting or elections, politely inform that you can only answer questions about Indian voter and voting processes.
        
        User's question: "${message}"`;

        try {
            const response = await axios.post(
                GEMINI_URL,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 500
                    }
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
                console.error("Gemini API Error:", response.data);
                return handleStaticResponse(req, res);
            }

            let reply = response.data.candidates[0].content.parts[0].text;
            
            // Clean up the response to remove any prompt text
            reply = reply.replace(prompt, '').trim();
            
            // If the response is empty after cleaning, use static response
            if (!reply) {
                return handleStaticResponse(req, res);
            }

            // Save the conversation
            await saveConversation(userId, chatRoomId, message, reply);

            return res.status(200).json({ reply });
        } catch (error) {
            console.error("Gemini API Error:", error);
            return handleStaticResponse(req, res);
        }
    } catch (error) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: "Please try again later"
        });
    }
};

// Helper function to save conversation
async function saveConversation(userId, roomId, message, reply) {
    try {
        const chatMessage = new ChatMessage({
            userId: userId || null,
            roomId,
            message,
            reply,
            timestamp: new Date()
        });
        await chatMessage.save();
    } catch (error) {
        console.error("Error saving conversation:", error);
    }
}

// Helper function to handle static responses
function handleStaticResponse(req, res) {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();

    // Check exact phrases first (most specific)
    for (const [key, response] of Object.entries(staticResponses)) {
        if (lowerMessage.includes(key)) {
            return res.status(200).json({ reply: response });
        }
    }

    // Check for specific election-related keywords
    if (lowerMessage.includes('upcoming') || lowerMessage.includes('schedule') || lowerMessage.includes('next election') || lowerMessage.includes('when')) {
        return res.status(200).json({ reply: staticResponses['election schedule'] });
    }

    // Check for registration-related keywords
    if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('enroll') || lowerMessage.includes('how to vote')) {
        return res.status(200).json({ reply: staticResponses['how to register'] });
    }

    // Check for voter ID related keywords
    if (lowerMessage.includes('id') || lowerMessage.includes('card') || lowerMessage.includes('identification')) {
        return res.status(200).json({ reply: staticResponses['voter id card'] });
    }

    // Check for eligibility related keywords
    if (lowerMessage.includes('eligible') || lowerMessage.includes('who can') || lowerMessage.includes('qualify') || lowerMessage.includes('can i vote')) {
        return res.status(200).json({ reply: staticResponses['who can be a voter'] });
    }

    // Check for voting day related keywords
    if (lowerMessage.includes('voting day') || lowerMessage.includes('election day') || lowerMessage.includes('how to cast') || lowerMessage.includes('booth') || lowerMessage.includes('poll')) {
        return res.status(200).json({ reply: staticResponses['what should a voter do on voting day'] });
    }

    // If nothing matches, return the default response
    return res.status(200).json({ reply: defaultResponse });
}

// Get chat history for a specific room
exports.getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50 } = req.query;
        
        if (!roomId) {
            return res.status(400).json({ error: "Room ID is required" });
        }
        
        const messages = await ChatMessage.find({ room: roomId })
            .sort({ createdAt: 1 })
            .limit(parseInt(limit));
            
        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
};