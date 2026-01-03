import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Search, Globe, BookOpen, HelpCircle, Layers } from 'lucide-react';
import { BlogManagement } from './BlogManagement';
import { SEOManagement } from './SEOManagement';
import { HelpArticlesManagement } from './HelpArticlesManagement';
import { GlossaryManagement } from './GlossaryManagement';
import { PillarPagesManagement } from './PillarPagesManagement';

export const ContentManagementPanel = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="blog" className="w-full">
        <TabsList className="bg-card border-border flex-wrap h-auto p-1">
          <TabsTrigger value="blog" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Blog
          </TabsTrigger>
          <TabsTrigger value="help" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HelpCircle className="h-4 w-4 mr-2" />
            Ajuda
          </TabsTrigger>
          <TabsTrigger value="glossary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="h-4 w-4 mr-2" />
            Glossário
          </TabsTrigger>
          <TabsTrigger value="pillar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="h-4 w-4 mr-2" />
            Soluções
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Search className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="mt-4">
          <BlogManagement />
        </TabsContent>

        <TabsContent value="help" className="mt-4">
          <HelpArticlesManagement />
        </TabsContent>

        <TabsContent value="glossary" className="mt-4">
          <GlossaryManagement />
        </TabsContent>

        <TabsContent value="pillar" className="mt-4">
          <PillarPagesManagement />
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <SEOManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagementPanel;
