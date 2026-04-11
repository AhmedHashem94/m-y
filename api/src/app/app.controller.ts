import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('translate')
  async translate(
    @Query('q') text: string,
    @Query('from') from = 'ar',
    @Query('to') to = 'en',
  ) {
    if (!text?.trim()) return { translatedText: '' };
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    const data = await res.json();
    const raw: string = data.responseData?.translatedText || '';
    const first = raw.split(',')[0].trim();
    const translatedText = first.charAt(0).toUpperCase() + first.slice(1);
    return { translatedText };
  }
}
