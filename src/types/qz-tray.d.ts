
// Type definitions for QZ Tray
declare namespace qz {
  namespace websocket {
    function connect(): Promise<any>;
    function isActive(): boolean;
  }
  
  namespace configs {
    function create(printer: string | null): any;
  }
  
  namespace printers {
    function find(): Promise<string[]>;
  }
  
  function print(config: any, data: any[]): Promise<any>;
}
