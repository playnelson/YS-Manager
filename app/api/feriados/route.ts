import { NextResponse } from 'next/server';

// Helper to decrypt the specific XOR encoded payload from calendario.com.br
function decodePayload(base64Str: string): string {
    const key = "AFDsa%1!!2341R%#!$$";
    const binaryStr = atob(base64Str);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    }
    return new TextDecoder('utf-8').decode(bytes);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const uf = searchParams.get('state')?.toUpperCase();
    let rawCity = searchParams.get('city');

    if (!uf) {
        return NextResponse.json({ error: 'UF is required' }, { status: 400 });
    }

    try {
        let fetchUrl = `https://calendario.com.br/api/data.php?ano=${year}&estado=${uf}`;
        
        if (rawCity) {
            // Remove accents and uppercase format, e.g. "São Paulo" -> "SAO PAULO"
            const formattedCity = rawCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
            fetchUrl += `&cidade=${encodeURIComponent(formattedCity)}`;
        }

        const response = await fetch(fetchUrl, {
            headers: {
                'Origin': 'https://feriados.com.br',
                'Referer': 'https://feriados.com.br/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json([], { status: 200 }); // Graceful fallback
        }

        const base64Data = await response.text();
        if (!base64Data || base64Data.trim() === '') {
             return NextResponse.json([], { status: 200 });
        }

        const xmlString = decodePayload(base64Data);
        
        // Very basic XML parser using RegExp to extract events
        // Target shape matches <event><date>15/05/2026</date><name>Feriado</name><type>Municipal</type></event>
        // Or typical calendar XML items containing date/text values
        const holidays: any[] = [];
        
        // Look for date-like structures in the decoded XML, typical formats are DD/MM/YYYY and title
        // Example: <date>01/01/2026</date><name>Confraternização Universal</name><type>Feriado Nacional</type>
        // Since we don't know the exact tags, let's extract generically by finding dates in text
        
        const eventRegex = /<([^>]+)>([^<]*\d{2}\/\d{2}\/\d{4}[^<]*)<\/\1>.*?<([^>]+)>([^<]+)<\/\3>/gi;
        
        // This is a robust fallback: it searches for any date string DD/MM/YYYY and its surrounding text node
        const dateNamePairsRegex = />(\d{2}\/\d{2}\/\d{4})<.*?>(.*?)<\/.*?>/g;
        
        let match;
        // Attempt an aggressive match just extracting all MM-DD based data along with the holiday names
        const datePattern = />\s*(\d{2})\/(\d{2})\/(202\d)\s*<.*?>(.*?)<\//g;
        
        let found = false;
        while ((match = datePattern.exec(xmlString)) !== null) {
            found = true;
            const day = match[1];
            const month = match[2];
            const evtYear = match[3];
            const name = match[4].trim();
            
            // Standardize return
            const isoDate = `${evtYear}-${month}-${day}`;
            let type = 'regional';
            if (name.toLowerCase().includes('municipal')) type = 'municipal';
            if (name.toLowerCase().includes('estadual')) type = 'state';
            if (name.toLowerCase().includes('nacional')) type = 'national';
            if (name.toLowerCase().includes('facultativo')) type = 'optional';
            
            holidays.push({
                date: isoDate,
                name: name.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                type: type
            });
        }
        
        if(!found) {
            // Backup parser if the exact XML tags are <date="2026-01-01" name="Feriado" />
             const attrRegex = /[\'\"](\d{4}-\d{2}-\d{2})[\'\"].*?name=[\'\"]([^\'\"]+)[\'\"]/gi;
             while ((match = attrRegex.exec(xmlString)) !== null) {
                holidays.push({
                   date: match[1],
                   name: match[2],
                   type: 'regional'
                });
             }
        }
        
        // Clean duplicates
        const uniqueHols = holidays.reduce((acc, curr) => {
            if (!acc.find((x: any) => x.date === curr.date && x.name === curr.name)) {
                acc.push(curr);
            }
            return acc;
        }, []);

        return NextResponse.json(uniqueHols);
    } catch (e: any) {
        console.error('API /feriados error:', e);
        return NextResponse.json([], { status: 200 }); // Prevent frontend crashing
    }
}
