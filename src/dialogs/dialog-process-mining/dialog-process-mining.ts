import { EventAggregator } from "aurelia";
 
/**
 * Dialog for running Process Mining algorithms via the mmar-pm-service.
 */
export class DialogProcessMining {
 
    algorithmChoice: string = "inductive";
    isCsv: boolean = false;
    caseId: string = "case:concept:name";
    activityName: string = "concept:name";
    timestamp: string = "time:timestamp";
    statusMessage: string = "";
    statusColor: string = "black";

    isRunning: boolean = false;
 
    private selectedFile: File | null = null;

    csvColumns: string[] = [];
    fileInput: HTMLInputElement | null = null;
 
    constructor(
        private eventAggregator: EventAggregator,
    ) { }
 
    attached() {
        this.eventAggregator.subscribe("openProcessMiningDialog", async () => {
            // Reset state each time the dialog opens
            this.statusMessage = "";
            this.selectedFile = null;
            this.isCsv = false;
            this.csvColumns = [];
            this.algorithmChoice = "inductive";
            if (this.fileInput) this.fileInput.value = "";
            this.caseId = "case:concept:name";
            this.activityName = "concept:name";
            this.timestamp = "time:timestamp";
        });
    }
 
    onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.isCsv = this.selectedFile.name.toLowerCase().endsWith(".csv");
        
            if (this.isCsv) {
                // Read just the first line to get headers for column mapping
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (!e.target?.result) return;
                    const firstLine = (e.target.result as string).split('\n')[0];
                    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
                    this.csvColumns = firstLine.split(delimiter).map(col => col.trim().replace(/"/g, ''));
                };
                reader.readAsText(this.selectedFile);
            }
        }
    }
 
    async runProcessMining() {
        // Validate user input

        // Check if a file is selected
        if (!this.selectedFile) {
            this.statusMessage = "Please select a file first.";
            this.statusColor = "red";
            return;
        }
        // Check if algorithm is selected; should always be true, due to default
        if (!this.algorithmChoice) {
            this.statusMessage = "Please select an algorithm.";
            this.statusColor = "red";
            return;
        }
        //Check if column mapping is selected for .csv files
        if (this.isCsv && (!this.caseId || !this.activityName || !this.timestamp)) {
            this.statusMessage = "Please map all CSV columns before running.";
            this.statusColor = "red";
            return;
        }

        this.isRunning = true;
        this.statusMessage = "Running...";
        this.statusColor = "black";
 
        try {
            const formData = new FormData();
            formData.append("file", this.selectedFile);
 
            if (this.isCsv) {
                // Append CSV column mapping to formData
                formData.append("case_id", this.caseId);
                formData.append("activity_name", this.activityName);
                formData.append("timestamp", this.timestamp);
            }
            
            // request
            const response = await fetch(
                `http://localhost:8001/run?algorithm=${this.algorithmChoice}`,
                {
                    method: "POST",
                    body: formData,
                }
            );
 
            if (!response.ok) {
                const err = await response.text();
                this.statusMessage = `Error: ${err}`;
                this.statusColor = "red";
                return;
            }
            
            // User message to reload page
            this.statusMessage = "Success! Model saved. Reload the site to see it.";
            this.statusColor = "green";
 
        } catch (e: any) {
            this.statusMessage = `Request failed: ${e.message}`;
            this.statusColor = "red";
        } finally{
            this.isRunning = false;
        }
    }
}