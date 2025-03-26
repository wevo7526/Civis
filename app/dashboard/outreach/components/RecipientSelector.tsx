import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

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
  const [filterType, setFilterType] = useState<'all' | 'donor' | 'volunteer'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipients = recipients.filter(recipient => {
    const matchesType = filterType === 'all' || recipient.type === filterType;
    const matchesSearch = recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipient.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const recipientCounts = {
    donor: recipients.filter(r => r.type === 'donor').length,
    volunteer: recipients.filter(r => r.type === 'volunteer').length,
    participant: recipients.filter(r => r.type === 'participant').length
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-gray-700">Recipients</Label>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {selectedRecipients.length} selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="border-gray-200 hover:bg-gray-50"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="flex space-x-4">
        <Select value={filterType} onValueChange={(value: 'all' | 'donor' | 'volunteer') => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recipients</SelectItem>
            <SelectItem value="donor">Donors ({recipientCounts.donor})</SelectItem>
            <SelectItem value="volunteer">Volunteers ({recipientCounts.volunteer})</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Search recipients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="max-h-60 overflow-y-auto">
          {filteredRecipients.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No recipients found matching your criteria
            </p>
          ) : (
            filteredRecipients.map((recipient) => (
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
                <div className="flex-1">
                  <label htmlFor={`recipient-${recipient.id}`} className="text-sm text-gray-700">
                    {recipient.name}
                  </label>
                  <p className="text-xs text-gray-500">{recipient.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    recipient.type === 'donor' ? 'bg-green-100 text-green-800' :
                    recipient.type === 'volunteer' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {recipient.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 