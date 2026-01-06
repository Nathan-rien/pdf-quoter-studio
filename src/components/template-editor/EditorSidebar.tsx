/**
 * Sidebar de l'éditeur - Navigation entre les pages
 */

import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { Lock, FileText, Table, Settings } from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";

const PAGE_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  4: Table,
  5: Table,
  6: Settings,
};

export function EditorSidebar() {
  const { 
    selectedPageNumber, 
    setSelectedPage,
    currentVersion 
  } = useTemplateEditorStore();

  const pages = PDF_TEMPLATE_CONTRACT.pages;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Pages ({pages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[500px]">
          <div className="space-y-1">
            {pages.map((page) => {
              const isSelected = selectedPageNumber === page.pageNumber;
              const hasDynamicZones = page.dynamicZones.length > 0;
              const Icon = PAGE_ICONS[page.pageNumber] || FileText;
              
              return (
                <Button
                  key={page.pageNumber}
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto py-3 px-3",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setSelectedPage(page.pageNumber as PDFPageNumber)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded text-xs font-bold shrink-0",
                      hasDynamicZones 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {page.pageNumber}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {page.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1">
                        {page.type === 'static' && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            Statique
                          </Badge>
                        )}
                        {hasDynamicZones && (
                          <Badge variant="outline" className="text-[10px] h-4 gap-1">
                            <Lock className="h-2 w-2" />
                            {page.dynamicZones.length} zone{page.dynamicZones.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
