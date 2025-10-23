import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ImageCard({ image, onDelete }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 relative group">
        <img
          src={image.image_url}
          alt={image.product_name}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESem imagem%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
          <Button
            variant="destructive"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(image.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">{image.product_name}</h3>
          {image.description && (
            <p className="text-sm text-gray-600 mt-1">{image.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {image.category && (
            <Badge variant="secondary" className="text-xs">
              {image.category}
            </Badge>
          )}
          {image.tags?.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Usada {image.usage_count || 0}x</span>
          </div>
          {image.last_used_at && (
            <span>
              {format(new Date(image.last_used_at), "dd/MM/yy", { locale: ptBR })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}