import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'donor' | 'volunteer' | 'participant';
}

interface RecipientSelectorProps {
  recipients: Recipient[];
  selectedRecipients: Recipient[];
  onSelectionChange: (recipients: Recipient[]) => void;
}

export function RecipientSelector({ 
  recipients, 
  selectedRecipients, 
  onSelectionChange 
}: RecipientSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">Recipients</Label>
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            {selectedRecipients.length} recipients selected
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="border-gray-200 hover:bg-gray-50"
          >
            Clear Selection
          </Button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id={`recipient-${recipient.id}`}
                checked={selectedRecipients.some(r => r.id === recipient.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectionChange([...selectedRecipients, recipient]);
                  } else {
                    onSelectionChange(selectedRecipients.filter(r => r.id !== recipient.id));
                  }
                }}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor={`recipient-${recipient.id}`} className="text-sm text-gray-700">
                {recipient.name} ({recipient.email})
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 